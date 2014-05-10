var _ = require('underscore');
var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var ScheduleManager = require('./schedulemanager.js').ScheduleManager;

var app = express();
var manager = new DeviceManager();
var scheduleManager = new ScheduleManager({manager : manager});

app.configure(function () {
    app.set('views', __dirname + '/views')
    app.set('view engine', 'jade')
    app.use(express.bodyParser());
});

app.get('/', function(req, res) {
    var devices = _.map(manager.getDevices(), function (uuid) { 
        var device = manager.getDevice(uuid); 
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: scheduleManager.wakeUpSchedulesFor(uuid)
        }
    });
    res.render('index', { 
        title : 'Devices',
        devices: devices
    } );
});

app.post('/:uuid/wake-up', function(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        var schedule = {
            dayOfWeek: req.body.dayOfWeek,
            hour: req.body.hour,
            minute: req.body.minute
        };
        if (_.isArray(schedule.dayOfWeek) && _.isNumber(schedule.hour) && _.isNumber(schedule.minute)) {
            var wakeUp = scheduleManager.addWakeUpScheduleFor(uuid, schedule);
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
    if (scheduleManager.deleteWakeUpSchedule(uuid, id)) {
        res.send(204);
    } else {
        res.send(404);
    }
});

app.listen(18080);