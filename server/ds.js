var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var responseParsers = require('./responseparsers.js');

function toTrack(result, callback) {
    if (result['s:Envelope']['s:Body']['u:TrackResponse'].Uri) {
        callback(null, {
            track: result['s:Envelope']['s:Body']['u:TrackResponse'].Uri,
            metadata: result['s:Envelope']['s:Body']['u:TrackResponse'].Metadata
        });
    } else {
        callback(new Error('No track found'));
    }
}

function binaryIdArrayToIntList(result, callback) {
    var buffer = new Buffer(result['s:Envelope']['s:Body']['u:IdArrayResponse'].Array, 'base64');
    var arrayList = [];
    var binaryList = binary.parse(buffer);
    _.each(_.range(buffer.length / 4), function () {
        arrayList.push(binaryList.word32bu('a').vars.a);
    });
    callback(null, arrayList); 
}

function readListResponseToTracks(result, callback) {
    xmlParser.parseString(result['s:Envelope']['s:Body']['u:ReadListResponse'].TrackList, function (err, result) {
        if (err) {
            callback(err);
        } else {
            var tracks = [];
            if (_.isArray(result.TrackList.Entry)) {
                _.each(result.TrackList.Entry, function (track) {
                    tracks.push({
                        track: track.Uri,
                        metadata: track.Metadata
                    });
                });
            } else {
                if (result.TrackList.Entry) {
                    tracks.push({
                        track: result.TrackList.Entry.Uri,
                        metadata: result.TrackList.Entry.Metadata
                    });
                }
            }
            callback(null, tracks);
        }
    });
}

function parseStandbyResponse(result, callback) {
    callback(null, result['s:Envelope']['s:Body']['u:StandbyResponse'].Value);
}

exports.Ds = function(deviceUrlRoot) {
    this.currentTrackDetails = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Info',
            'urn:av-openhome-org:service:Info:1',
            'Track',
            '',
            responseParsers.xml(toTrack, callback)
        ).on('error', callback);
    };
    this.retrieveTrackDetails = function(idArray, callback) {
        var idArrayString = '';
        _.each(idArray, function (id) {
            idArrayString += (id + ' ');
        });
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'ReadList',
            '<IdList>' + idArrayString + '</IdList>',
            responseParsers.xml(readListResponseToTracks, callback)
        ).on('error', callback);
    };
    this.getTrackIds = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'IdArray',
            '',
            responseParsers.xml(binaryIdArrayToIntList, callback)
        ).on('error', callback);
    };
    this.deleteAll = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'DeleteAll',
            '',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Delete failed with status " + res.statusCode));
                }
            }
        ).on('error', callback);
    };
    this.queueTrack = function(trackDetailsXml, afterId, callback) {
        xmlParser.parseString(trackDetailsXml, function (err, result) {
            if (err) {
                callback(err);
            } else {
                var resources = _.isArray(result['DIDL-Lite']['item']['res']) ? result['DIDL-Lite']['item']['res'][0] : result['DIDL-Lite']['item']['res'];
                var res = _.isObject(resources) ? resources._ : resources;
                if (!res) {
                    callback(new Error('Error adding ' + trackDetailsXml));
                } else {
                    var trackUri = res
                        .replace(/&/g, "&amp;");
                    var metadata = trackDetailsXml
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;");
                    upnp.soapRequest(
                        deviceUrlRoot,
                        'Ds/Playlist',
                        'urn:av-openhome.org:service:Playlist:1',
                        'Insert',
                        '<AfterId>' + afterId + '</AfterId><Uri>' + trackUri + '</Uri><Metadata>' + metadata + '</Metadata>',
                        function (res) {
                            if (res.statusCode === 200) {
                                callback();
                            } else {
                                callback(new Error("Queue failed with " + res.statusCode));
                            }
                        }
                    ).on('error', callback);
                }
            }
        });
    };
    this.changeSource = function (source, callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Product/control',
            'urn:av-openhome.org:service:Product:1',
            'SetSourceIndex',
            '<Value>'+source+'</Value>',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Change Source failed with status " + res.statusCode));
                }
            }
        ).on('error', callback);
    };
    this.standbyState = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Product/control',
            'urn:av-openhome.org:service:Product:1',
            'Standby',
            '',
            responseParsers.xml(parseStandbyResponse, callback)
        ).on('error', callback);
    };
    this.powerOn = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Product/control',
            'urn:av-openhome.org:service:Product:1',
            'SetStandby',
            '<Value>0</Value>',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Power On failed with status " + res.statusCode));
                }
            }
        ).on('error', callback);
    };
    this.powerOff = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Product/control',
            'urn:av-openhome.org:service:Product:1',
            'SetStandby',
            '<Value>1</Value>',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Power Off failed with status " + res.statusCode));
                }
            }
        ).on('error', callback);
    };
    this.playRadio = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Radio/control',
            'urn:av-openhome.org:service:Radio:1',
            'Play',
            '',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Play Radio failed with status " + res.statusCode));
                }
            }
        ).on('error', callback);
    };
    this.playPlaylistFromStart = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'SeekIndex',
            '<Value>0</Value>',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Play Playlist failed with status " + res.statusCode));
                }
            }
        ).on('error', callback);
    };
};