var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');
var scheduler = require('node-schedule');
var storage = require('node-persist');
var guid = require('node-uuid');

var manager = new DeviceManager();
var app = express();

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.bodyParser());
app.listen(18080);

storage.initSync();

if (!storage.getItem('schedules.json')) {
    storage.setItem('schedules.json', []);
}

var wakeUpSchedulesFor = function (uuid) {
    return _.chain(storage.getItem('schedules.json'))
        .filter(function(schedule) {
            return schedule.uuid === uuid;
        })
        .pluck('wakeUp')
        .value();
};

var addWakeUpScheduleFor = function (uuid, schedule) {
    var schedules = storage.getItem('schedules.json');
    var wakeUp = {
        id: guid.v1(),
        uuid: uuid,
        source: 1,
        wakeUp: schedule
    };
    schedules.push(wakeUp)
    storage.setItem('schedules.json', schedules);
    return wakeUp;
}

var deleteWakeUpSchedule = function (uuid, id) {
    var schedules = storage.getItem('schedules.json');
    var newSchedules = _.reject(schedules, function (wakeUpSchedule) {
        return wakeUpSchedule.uuid === uuid && wakeUpSchedule.id == id;
    });
    if (newSchedules.length < schedules.length) {
        storage.setItem('schedules.json', newSchedules);
        return true;
    }
    return false;
}

var changeSource = function (uuid, sourceId) {
    return function () {
        var device = manager.getDevice(uuid);
        if (device) {
            manager.changeSource(device, sourceId);
        }
    }
};

var recurrenceRuleFactory = function (schedule) {
    var recurrence = new scheduler.RecurrenceRule();
    recurrence.dayOfWeek = schedule.wakeUp.dayOfWeek;
    recurrence.hour = schedule.wakeUp.hour;
    recurrence.minute = schedule.wakeUp.minute;
    return recurrence;
};


var jobs = [];
var scheduleJobs = function () {
    _.each(jobs, function (job) {
        job.cancel();
    });
    jobs = _.map(storage.getItem('schedules.json'), function (schedule) {
        return scheduler.scheduleJob(recurrenceRuleFactory(schedule), changeSource(schedule.uuid, schedule.source));
    });
};

app.get('/', function(req, res) {
    var devices = _.map(manager.getDevices(), function (uuid) { 
        var device = manager.getDevice(uuid); 
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: wakeUpSchedulesFor(uuid)
        }
    });
    res.render('index', { 
        title : 'Devices',
        devices: devices
    } );
});

var isValidSchedule = function (schedule) {
    return _.isArray(schedule.dayOfWeek) &&
           _.isNumber(schedule.hour) &&
           _.isNumber(schedule.minute);
};

app.post('/:uuid/wake-up', function(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        var schedule = {
            dayOfWeek: req.body.dayOfWeek,
            hour: req.body.hour,
            minute: req.body.minute
        };
        if (isValidSchedule(schedule)) {
            var wakeUp = addWakeUpScheduleFor(uuid, schedule);
            scheduleJobs();
            res.location('/'+uuid+'/wake-up/'+wakeUp.id);
            res.send(201, schedule);
        } else {
            res.send(400);
        }
    } else {
        res.send(404);
    }
});

app.delete('/:uuid/wake-up/:id', function(req, res) {
    var uuid = req.params.uuid;
    var id = req.params.id;
    if (deleteWakeUpSchedule(uuid, id)) {
        scheduleJobs();
        res.send(204);
    } else {
        res.send(404);
    }
});

scheduleJobs();