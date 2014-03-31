var upnp = require("./lib/upnp.js");
var http = require('http');
var parseXml = require('xml2js').parseString;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

var DeviceManager = function () {
    const playlistService = 'urn:av-openhome-org:service:Playlist:1';
    const linnSources = 'urn:linn-co-uk:device:Source:1';

    var controlPoint = new upnp.ControlPoint();
    var that = this;

    var devices = {};

    this.getDevices = function () {
        return _.keys(devices);
    }

    this.getDevice = function (uuid) {
        var device = devices[uuid];
        return { 
            name: device.name, 
            icon: _.clone(devices[uuid].icon)
        };
    }

    controlPoint.on("DeviceAvailable", function(res) {
        if (res.nt === playlistService)
        {
            var uuid = that.parseUuid(res.usn, res.nt);
            that.processDevice(res.location, function (device) {
                devices[uuid] = device;
                that.emit('available', uuid);
            });
        }
    });

    controlPoint.on("DeviceUnavailable", function(res) {
        if (res.nt === playlistService)
        {
            var uuid = that.parseUuid(res.usn, res.nt);
            if (devices[uuid]) {
                var device = devices[uuid];
                delete devices[uuid];
                that.emit('remove', device);
            }
        }
    });

    controlPoint.on("DeviceFound", function(res) {
        var uuid = that.parseUuid(res.usn, res.st);
        that.processDevice(res.location, function (device) {
            devices[uuid] = device;
            that.emit('discovered', uuid);
        });
    });

    controlPoint.search(linnSources);
}
util.inherits(DeviceManager, EventEmitter);
exports.DeviceManager = DeviceManager;

DeviceManager.prototype.parseUuid = function (usn, st) {
    return /uuid:(.*)?::.*/.exec(usn)[1];
}

DeviceManager.prototype.processDevice = function (location, callback) {
    http.get(location, function (res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            parseXml(body, function (err, result) {
                device = {
                    name: result.root.device[0].friendlyName[0],
                }
                if (result.root.device[0].iconList) {
                    device['icon'] = result.root.device[0].iconList[0].icon[0]
                }
                callback(device);
            });
        });
    });
}