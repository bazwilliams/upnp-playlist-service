var express = require('express');
var DeviceManager = require('./devicemanager.js').DeviceManager;
var _ = require('underscore');

var manager = new DeviceManager();
var app = express();

app.get('/', function(req, res) {
	_.each(manager.getDevices(), function (uuid) {
		res.send(manager.getDevice(uuid).name);
	});
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});