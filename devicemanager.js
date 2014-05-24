var upnp = require("./lib/upnp.js");
var http = require('http');
var xml2js = require('xml2js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var xmlParser = new xml2js.Parser({explicitArray: false});
var url = require('url');
var binary = require('binary');

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

var minimServerUriToRelativeFile = function (uri) {
    var fileTrack = uri.replace(/http:.*\/minimserver\/\*/, '');
    var track = decodeURI(fileTrack.replace(/\*/g,'%'));
    return track;
}

var processReadListResponse = function (device, callback) {
    return function(res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            xmlParser.parseString(body, function (err, result) {
                xmlParser.parseString(result['s:Envelope']['s:Body']['u:ReadListResponse'].TrackList, function (err, result) {
                    var tracks = [];
                    _.each(result.TrackList.Entry, function (track) {
                        tracks.push(minimServerUriToRelativeFile(track.Uri));
                    });
                    callback(tracks);
                });
            });
        });
    };
};

var generatePlaylist = function (device, idArray, playlistName) {
    var deviceUrl = url.parse(device.urlRoot);
    
    var idArrayString = '';
    _.each(idArray, function (id) {
        idArrayString += (id + ' ');
    });
    var bodyString = '<?xml version="1.0"?>';
    bodyString += '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">';
    bodyString += '  <s:Body s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
    bodyString += '    <u:ReadList xmlns:u="urn:av-openhome.org:service:Playlist:1">';
    bodyString += '      <IdList>'+idArrayString+'</IdList>'
    bodyString += '    </u:ReadList>';
    bodyString += '  </s:Body>';
    bodyString += '</s:Envelope>';

    var buffer = new Buffer(bodyString);

    var storePlaylist = function (tracks) {
        console.log(tracks);
    };

    var req = http.request({
        host: deviceUrl.hostname,
        port: 80,
        path: 'Ds/Playlist',
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Accept': 'text/xml',
            'SOAPAction': 'urn:av-openhome.org:service:Playlist:1#ReadList',
            'Content-length': buffer.length
        }
    }, processReadListResponse(device, storePlaylist));
    req.write(buffer);
    req.end();
}

var processPlaylistResponse = function (device, playlistName) {
    return function(res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            xmlParser.parseString(body, function (err, result) {
                var buffer = new Buffer(result['s:Envelope']['s:Body']['u:IdArrayResponse'].Array, 'base64');
                var arrayList = [];
                var binaryList = binary.parse(buffer);
                _.each(_.range(buffer.length / 4), function () {
                    arrayList.push(binaryList.word32bu('a').vars.a);
                });
                generatePlaylist(device, arrayList, playlistName);
            });
        });
    };
};

DeviceManager.prototype.savePlaylist = function (device, playlistName) {
    var deviceUrl = url.parse(device.urlRoot);
    
    var bodyString = '<?xml version="1.0"?>';
    bodyString += '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">';
    bodyString += '  <s:Body s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
    bodyString += '    <u:IdArray xmlns:u="urn:av-openhome.org:service:Playlist:1">';
    bodyString += '    </u:IdArray>';
    bodyString += '  </s:Body>';
    bodyString += '</s:Envelope>';

    var buffer = new Buffer(bodyString);

    var req = http.request({
        host: deviceUrl.hostname,
        port: 80,
        path: 'Ds/Playlist',
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Accept': 'text/xml',
            'SOAPAction': 'urn:av-openhome.org:service:Playlist:1#IdArray',
            'Content-length': buffer.length
        }
    }, processPlaylistResponse(device, playlistName));
    req.write(buffer);
    req.end();
}

DeviceManager.prototype.changeSource = function (device, source) {
    var deviceUrl = url.parse(device.urlRoot);

    var bodyString = '<?xml version="1.0"?>';
    bodyString += '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">';
    bodyString += '  <s:Body s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
    bodyString += '    <u:SetSourceIndex xmlns:u="urn:av-openhome.org:service:Product:1">';
    bodyString += '      <Value>'+source+'</Value>';
    bodyString += '    </u:SetSourceIndex>';
    bodyString += '  </s:Body>';
    bodyString += '</s:Envelope>';

    var buffer = new Buffer(bodyString);

    var req = http.request({
        host: deviceUrl.hostname,
        port: 80,
        path: 'Ds/Product/control',
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Accept': 'text/xml',
            'SOAPAction': 'urn:av-openhome.org:service:Product:1#SetSourceIndex',
            'Content-length': buffer.length
        }
    });
    req.write(buffer);
    req.end();
};
