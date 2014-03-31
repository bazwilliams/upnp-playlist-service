var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');

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

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});