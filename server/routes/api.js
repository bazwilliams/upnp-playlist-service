var _ = require('underscore');

var DeviceManager = require('../devicemanager.js').DeviceManager;
var ScheduleManager = require('../schedulemanager.js').ScheduleManager;
var playlists = require('../playlists.js');

var manager = new DeviceManager();
var scheduleManager = new ScheduleManager({manager : manager});
var zpad = require('zpad');

function convertFromSchedule(schedule) {
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
        time: zpad(schedule.wakeUp.hour) + ':' + zpad(schedule.wakeUp.minute),
        links: [{
            rel: 'delete',
            href: '/api/devices/'+schedule.uuid+'/wake-up/'+schedule.id
        }]
    };
}
function convertToSchedule(data) {
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
}
exports.devices = function(req, res) {
    var devices = _.map(manager.getDevices(), function deviceToResource(uuid) {
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
            scheduleManager.addWakeUpScheduleFor(uuid, schedule, function responseHandler(err, wakeUp) {
                if (err) {
                    res.status(400).send(err);
                } else {
                    res.location('/device/' + uuid + '/wake-up/' + wakeUp.id);
                    res.status(201).send(schedule);
                }
            });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(404);
    }
};
exports.deleteWakeUp = function (req, res) {
    var uuid = req.params.uuid;
    var id = req.params.id;
    scheduleManager.deleteWakeUpSchedule(uuid, id, function responseHandler(err, results) {
        if (err) {
            res.status(404).send(err);
        } else {
            res.sendStatus(204);
        }
    });
};
exports.storePlaylist = function (req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        playlists.savePlaylist(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.sendStatus(201);
            }
        });
    } else {
        res.sendStatus(404);
    }
};
exports.replacePlaylist = function (req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.body.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        playlists.replacePlaylist(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(404);
    }
};