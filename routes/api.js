var _ = require('underscore');

var DeviceManager = require('../devicemanager.js').DeviceManager;
var ScheduleManager = require('../schedulemanager.js').ScheduleManager;
var playlistManager = require('../playlistmanager.js');

var manager = new DeviceManager();
var scheduleManager = new ScheduleManager({manager : manager});


/*
 * Serve JSON to our AngularJS client
 */

exports.name = function (req, res) {
  res.json({
    name: 'Bob'
  });
};

exports.devices = function(req, res) {
    var devices = _.map(manager.getDevices(), function (uuid) { 
        var device = manager.getDevice(uuid); 
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: scheduleManager.wakeUpSchedulesFor(uuid)
        }
    });
    res.json(devices);
};

exports.setWakeUp = function(req, res) {
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
            res.location('/device/'+uuid+'/wake-up/'+wakeUp.id);
            res.send(201, schedule);
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
    }
    res.send(404);
};

exports.storePlaylist = function(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        playlistManager.savePlaylist(device, playlistName);
        res.send(201);
    }
    res.send(404);
};