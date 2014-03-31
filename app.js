var upnp = require("./lib/upnp.js");
var http = require('http');
var parseXml = require('xml2js').parseString;
var _ = require('underscore');
var util = require('util');

var parseUuid = function (usn, st) {
    return uuidExp.exec(usn)[1];
}

var processDevice = function (location, callback) {
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

const uuidExp = /uuid:(.*)?::.*/;
const locationExp = /(http:\/\/?)(.*:\d*:?)(\/.*:?)/;
const playlistService = 'urn:av-openhome-org:service:Playlist:1';
const linnSources = 'urn:linn-co-uk:device:Source:1';

var controlPoint = new upnp.ControlPoint();

var devices = {};

controlPoint.on("DeviceAvailable", function(res) {
    if (res.nt === playlistService)
    {
        var uuid = parseUuid(res.usn, res.nt);
        processDevice(res.location, function (device) {
            console.log('Notified of '+device.name);
            devices[uuid] = device;
        });
    }
});

controlPoint.on("DeviceUnavailable", function(res) {
    if (res.nt === playlistService)
    {
        var uuid = parseUuid(res.usn, res.nt);
        if (devices[uuid]) {
            console.log('Removing '+devices[uuid].name);
            delete devices[uuid];
        }
    }
});

controlPoint.on("DeviceFound", function(res) {
    var uuid = parseUuid(res.usn, res.st);
    processDevice(res.location, function (device) {
        console.log('Discovered '+device.name);
        devices[uuid] = device;
    });
});

controlPoint.search(linnSources);