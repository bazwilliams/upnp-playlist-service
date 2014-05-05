var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');
var scheduler = require('node-schedule');
var storage = require('node-persist');

var manager = new DeviceManager();
var app = express();

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.get('/', function(req, res) {
	var devices = _.map(manager.getDevices(), function (uuid) { 
		var device = manager.getDevice(uuid); 
		return {
			uuid: uuid,
			icon: device.icon,
			name: device.name
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

storage.initSync();

if (!storage.getItem('schedules.json')) {
    storeage.setItem('schedules.json', []);
}

_.each(storage.getItem('schedules.json'), function (schedule) {
	var recurrence = new scheduler.RecurrenceRule();
	recurrence.dayOfWeek = schedule.dayOfWeek;
	recurrence.hour = schedule.hour;
	recurrence.minute = schedule.minute;
	scheduler.scheduleJob(recurrence, changeSource(schedule.uuid,schedule.source));
});
