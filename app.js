var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');
var scheduler = require('node-schedule');
var storage = require('node-persist');

var manager = new DeviceManager();
var app = express();

storage.initSync();

if (!storage.getItem('schedules.json')) {
    storage.setItem('schedules.json', []);
}

var schedulesFor = function (uuid) {
    return _.filter(storage.getItem('schedules.json'), function(schedule) {
        return schedule.uuid === uuid;
    });
};

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.get('/', function(req, res) {
    var devices = _.map(manager.getDevices(), function (uuid) { 
        var device = manager.getDevice(uuid); 
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: schedulesFor(uuid)
        }
    });
    res.render('index', { 
        title : 'Devices',
        devices: devices
    } );
});

var server = app.listen(18080);

var changeSource= function (uuid, sourceId) {
    return function () {
        var device = manager.getDevice(uuid);
        if (device) {
                manager.changeSource(device, sourceId);
        }
    }
};

_.each(storage.getItem('schedules.json'), function (schedule) {
    var recurrence = new scheduler.RecurrenceRule();
    recurrence.dayOfWeek = schedule.wakeUp.dayOfWeek;
    recurrence.hour = schedule.wakeUp.hour;
    recurrence.minute = schedule.wakeUp.minute;
    scheduler.scheduleJob(recurrence, changeSource(schedule.uuid,schedule.source));
});