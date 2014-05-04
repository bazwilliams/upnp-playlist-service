var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');
var schedule = require('node-schedule');

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

var switchOnKitchenRadio = function () {
    var kitchen = manager.getDevice('4c494e4e-0026-0f21-d74b-01333078013f');
    manager.changeSource(kitchen, 1);
};

var weekdayMornings = new schedule.RecurrenceRule();
weekdayMornings.dayOfWeek = [new schedule.Range(1, 5)];
weekdayMornings.hour = 6;
weekdayMornings.minute = 45;

schedule.scheduleJob(weekdayMornings, switchOnKitchenRadio);