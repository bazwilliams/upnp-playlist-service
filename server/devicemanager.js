var ssdp = require("../node-ssdp");
var http = require('http');
var _ = require('underscore');
var url = require('url');
var Ds = require('./ds.js').Ds;
var responseParsers = require('./responseparsers.js');
var devices = {};

const linnSources = 'urn:linn-co-uk:device:Source:1';

function parseUuid (usn, st) {
    return (/uuid:(.*)?::.*/).exec(usn)[1];
}

function toDeviceUsingLocation(location) {
    return function toDevice(result, callback) {
        var ds = new Ds(location);
        ds.getSources(function (err, results) {
            if (err) {
                callback(err);
            } else {
                device = {
                    name: result.root.device.friendlyName,
                    urlRoot: location,
                    serviceList: result.root.device.serviceList.service,
                    sourceList: results,
                    ds: ds
                };
                if (result.root.device.iconList) {
                    var icon = _.isArray(result.root.device.iconList.icon) ? result.root.device.iconList.icon[0] : result.root.device.iconList.icon;
                    device.icon = {
                        mimetype: icon.mimetype,
                        width: icon.width,
                        height: icon.height,
                        depth: icon.depth,
                        url: url.resolve(location, icon.url)
                    }
                }
                callback(null, device); 
            }
        });
    }
}

function processDevice(location, callback) {
    http.get(location, responseParsers.xml(toDeviceUsingLocation(location), callback)).on('error', callback);
}

exports.getDevices = function getDevices() {
    return _.keys(devices);
};
exports.getDevice = function getDevice(uuid) {
    return devices[uuid];
};

ssdp.on("DeviceAvailable:urn:av-openhome-org:service:Playlist:1", function onDeviceAvailable(res) {
    var uuid = parseUuid(res.usn, res.nt);
    processDevice(res.location, function makeDeviceAvailable(err, device) {
        if (err) {
            console.log("Problem processing device: " + err);
        } else {
            devices[uuid] = device;
            console.log("Available: " + device.name);
        }
    });
});

ssdp.on("DeviceUnavailable:urn:av-openhome-org:service:Playlist:1", function onDeviceUnavailable(res) {
    var uuid = parseUuid(res.usn, res.nt);
    if (devices[uuid]) {
        var device = devices[uuid];
        console.log("Removing: " + device.name);
        delete devices[uuid];
    }
});

ssdp.on("DeviceFound", function onDeviceFound(res) {
    var uuid = parseUuid(res.usn, res.st);
    processDevice(res.location, function makeDeviceAvailable(err, device) {
        if (err) {
            console.log("Problem processing device: " + err);
        } else {
            devices[uuid] = device;
            console.log("Found: " + device.name);
        }
    });
});

ssdp.mSearch(linnSources);