var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');
var scheduler = require('node-schedule');
var storage = require('node-persist');

var manager = new DeviceManager();
var app = express();

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
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

_.each(storage.getItem('schedules.json'), function (schedule) {
    scheduler.scheduleJob(recurrenceRuleFactory(schedule), changeSource(schedule.uuid,schedule.source));
});
