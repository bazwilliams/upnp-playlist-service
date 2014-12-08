var _ = require('underscore');

var DeviceManager = require('../devicemanager.js').DeviceManager;
var ScheduleManager = require('../schedulemanager.js').ScheduleManager;
var PlaylistManager = require('../playlistmanager.js').PlaylistManager;

var manager = new DeviceManager();
var scheduleManager = new ScheduleManager({manager : manager});

var padZero = function (n, len) {
    var num = parseInt(n, 10);
    len = parseInt(len, 10);
    if (isNaN(num) || isNaN(len)) {
        return n;
    }
    num = ''+num;
    while (num.length < len) {
        num = '0'+num;
    }
    return num;
};

var convertFromSchedule = function(schedule) {
    var days = {
        'mon' : false,
        'tue' : false,
        'wed' : false,
        'thu' : false,
        'fri' : false,
        'sat' : false,
        'sun' : false
    };
    _.each(schedule.wakeUp.dayOfWeek, function (day) {
        var key = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day];
        days[key] = true;
    });
    return {
        days: days,
        time: padZero(schedule.wakeUp.hour,2) + ':' + padZero(schedule.wakeUp.minute,2),
        links: [{
            rel: 'delete',
            href: '/api/devices/'+schedule.uuid+'/wake-up/'+schedule.id
        }]
    };
};

var convertToSchedule = function(data) {
    var dayOfWeek = [];
    _.each(_.keys(data.days), function (key) {
        var result = ['sun','mon','tue','wed','thu','fri','sat'].indexOf(key);
        if (result !== void 0 && data.days[key]) {
            dayOfWeek.push(result);
        }
    });
    if (data.time && data.time.split(':').length === 2)
    {
        return {
            dayOfWeek: dayOfWeek,
            hour: parseInt(data.time.split(':')[0],10),
            minute: parseInt(data.time.split(':')[1],10)
        };
    }
};

exports.devices = function(req, res) {
    var devices = _.map(manager.getDevices(), function (uuid) {
        var device = manager.getDevice(uuid);
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: _.map(scheduleManager.wakeUpSchedulesFor(uuid), convertFromSchedule),
            links: [{
                rel: 'store-playlist',
                href: '/api/devices/' + uuid + '/playlist/'
            },{
                rel: 'replace-playlist',
                href: '/api/devices/' + uuid + '/playlist/replace'
            },{
                rel: 'add-wakeup',
                href: '/api/devices/' + uuid + '/wake-up'
            }]
        };
    });
    res.json(devices);
};

exports.setWakeUp = function(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        var schedule = convertToSchedule(req.body);
        if (schedule && _.isArray(schedule.dayOfWeek) && _.isNumber(schedule.hour) && _.isNumber(schedule.minute)) {
            var wakeUp = scheduleManager.addWakeUpScheduleFor(uuid, schedule);
            if (wakeUp) {
                res.location('/device/'+uuid+'/wake-up/'+wakeUp.id);
                res.send(201, schedule);
            } else {
                res.send(400);
            }
        } else {
            res.send(400);
        }
    }
    res.send(404);
};

exports.deleteWakeUp = function(req, res) {
    var uuid = req.params.uuid;
    var id = req.params.id;
    if (scheduleManager.deleteWakeUpSchedule(uuid, id)) {
        res.send(204);
    } else {
        res.send(404);
    }
};

exports.storePlaylist = function(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        new PlaylistManager(device).savePlaylist(playlistName);
        res.send(201);
    } else {
        res.send(404);
    }
};

exports.replacePlaylist = function(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.body.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        new PlaylistManager(device).replacePlaylist(playlistName);
        res.send(200);
    } else {
        res.send(404);
    }
};