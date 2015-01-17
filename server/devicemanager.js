var upnp = require("./lib/upnp.js");
var http = require('http');
var _ = require('underscore');
var url = require('url');
var Ds = require('./ds.js').Ds;
var responseParsers = require('./responseparsers.js');
var controlPoint = new upnp.ControlPoint();
var devices = {};

const playlistService = 'urn:av-openhome-org:service:Playlist:1';
const linnSources = 'urn:linn-co-uk:device:Source:1';

function parseUuid (usn, st) {
    return (/uuid:(.*)?::.*/).exec(usn)[1];
}

function toDevice(result, callback) {
    device = {
        name: result.root.device.friendlyName,
        urlRoot: result.root.URLBase,
        serviceList: result.root.device.serviceList.service,
        ds: new Ds(result.root.URLBase)
    };
    if (result.root.device.iconList) {
        device.icon = result.root.device.iconList.icon;
    }
    callback(null, device);
}

function processDevice(location, callback) {
    console.log(location);
    http.get(location, responseParsers.xml(toDevice, callback)).on('error', callback);
}

exports.getDevices = function getDevices() {
    return _.keys(devices);
};
exports.getDevice = function getDevice(uuid) {
    return devices[uuid];
};
exports.subscribe = function subscribe(device, serviceType) {
    var urlRoot = url.parse(device.urlRoot);
    var service = _.findWhere(device.serviceList, { serviceType : serviceType });
    if (service) {
        upnp.subscribe(urlRoot.hostname, urlRoot.port, service.eventSubURL);
    }
};

controlPoint.on("DeviceAvailable", function onDeviceAvailable(res) {
    if (res.nt === playlistService)
    {
        var uuid = parseUuid(res.usn, res.nt);
        processDevice(res.location, function makeDeviceAvailable(err, device) {
            if (err) {
                console.log("Problem processing device: " + err);
            } else {
                devices[uuid] = device;
            }
        });
    }
});

controlPoint.on("DeviceUnavailable", function onDeviceUnavailable(res) {
    if (res.nt === playlistService)
    {
        var uuid = parseUuid(res.usn, res.nt);
        if (devices[uuid]) {
            var device = devices[uuid];
            delete devices[uuid];
        }
    }
});

controlPoint.on("DeviceFound", function onDeviceFound(res) {
    var uuid = parseUuid(res.usn, res.st);
    processDevice(res.location, function makeDeviceAvailable(err, device) {
        if (err) {
            console.log("Problem processing device: " + err);
        } else {
            devices[uuid] = device;
        }
    });
});

controlPoint.search(linnSources);