var upnp = require("./lib/upnp.js");
var http = require('http');
var xml2js = require('xml2js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var xmlParser = new xml2js.Parser({explicitArray: false});
var url = require('url');

var DeviceManager = function () {
    const playlistService = 'urn:av-openhome-org:service:Playlist:1';
    const linnSources = 'urn:linn-co-uk:device:Source:1';

    var controlPoint = new upnp.ControlPoint();
    var that = this;

    var devices = {};

    this.getDevices = function () {
        return _.keys(devices);
    };

    this.getDevice = function (uuid) {
        return devices[uuid];
    };

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
};
util.inherits(DeviceManager, EventEmitter);
exports.DeviceManager = DeviceManager;

DeviceManager.prototype.parseUuid = function (usn, st) {
    return (/uuid:(.*)?::.*/).exec(usn)[1];
};

DeviceManager.prototype.processDevice = function (location, callback) {
    http.get(location, function (res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            xmlParser.parseString(body, function (err, result) {
                device = {
                    name: result.root.device.friendlyName,
                    urlRoot: result.root.URLBase,
                    serviceList: result.root.device.serviceList.service
                };
                if (result.root.device.iconList) {
                    device['icon'] = result.root.device.iconList.icon;
                }
                callback(device);
            });
        });
    });
};

DeviceManager.prototype.subscribe = function (device, serviceType) {
    var urlRoot = url.parse(device.urlRoot);
    var service = _.findWhere(device.serviceList, { serviceType : serviceType });
    if (service) {
        upnp.subscribe(urlRoot.hostname, urlRoot.port, service.eventSubURL);
    }
};