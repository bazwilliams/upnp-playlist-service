"use strict";

var ssdp = require("node-upnp-ssdp");
var http = require('http');
var _ = require('underscore');
var url = require('url');
var Ds = require('./ds.js').Ds;
var responseParsers = require('./responseparsers.js');
var logger = require('./logger.js');

var devices = {};

var searchType = 'urn:av-openhome-org:service:Product:1';

function parseUuid (usn) {
    return (/uuid:(.*)?::.*/).exec(usn)[1];
}

function processServiceListArray(serviceList) {
    return _.reduce(serviceList, function (memo, item) {
        memo[item.serviceType] = {
            serviceId: item.serviceId,
            scpdurl: item.SCPDURL,
            controlUrl: item.controlURL,
            eventSubUrl: item.eventSubURL
        };
        return memo;
    }, {});
}

function fetchIcon(icon) {
    var iconArray = _.isArray(icon) ? icon : [icon];
    return _.chain(iconArray)
        .reject(function (item) { return item.height > 50; })
        .first()
        .value();
}

function toDeviceUsingLocation(location) {
    return function toDevice(result, callback) {
        var ds = new Ds(location, processServiceListArray(result.root.device.serviceList.service));
        logger.debug('Getting sources at '+location);
        ds.getSources(function (err, results) {
            var device;
            if (err) {
                callback(err);
            } else {
                device = {
                    name: result.root.device.friendlyName,
                    urlRoot: location,
                    sourceList: results,
                    ds: ds
                };
                if (result.root.device.iconList) {
                    var icon = fetchIcon(result.root.device.iconList.icon);
                    device.icon = {
                        mimetype: icon.mimetype,
                        width: icon.width,
                        height: icon.height,
                        depth: icon.depth,
                        url: url.resolve(location, icon.url)
                    };
                }
                callback(null, device);
            }
        });
    };
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
            logger.warn('Problem processing device at ' + res.location);
            logger.warn(err);
        } else {
            devices[uuid] = device;
            logger.info("Available: " + device.name);
        }
    });
});

ssdp.on("DeviceUnavailable:urn:av-openhome-org:service:Playlist:1", function onDeviceUnavailable(res) {
    var uuid = parseUuid(res.usn, res.nt);
    if (devices[uuid]) {
        var device = devices[uuid];
        logger.info("Removing: " + device.name);
        delete devices[uuid];
    }
});

ssdp.on("DeviceFound", function onDeviceFound(res) {
    if (res.st === searchType) {
      var uuid = parseUuid(res.usn, res.st);
      processDevice(res.location, function makeDeviceAvailable(err, device) {
        if (err) {
            logger.warn('Problem processing device at ' + res.location);
            logger.warn(err);
        } else {
            devices[uuid] = device;
            logger.info("Found: " + device.name);
        }
      });
    }
});

ssdp.mSearch(searchType);
