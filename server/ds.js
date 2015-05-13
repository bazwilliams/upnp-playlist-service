var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var responseParsers = require('./responseparsers.js');

function encode(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
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
function toSourceList(result, callback) {
    if (result && result['s:Envelope']['s:Body']['u:SourceXmlResponse']) {
            xmlParser.parseString(result['s:Envelope']['s:Body']['u:SourceXmlResponse'].Value, function (err, result) {
            callback(null, result.SourceList.Source)
        });
    } else {
        callback(new Error('No sourceXml Found'));
    }
}
function parseNewId(result, callback) {
    if (result['s:Envelope']['s:Body']['u:InsertResponse']) {
        callback(null, result['s:Envelope']['s:Body']['u:InsertResponse'].NewId)
    } else {
        callback(new Error('No NewId Found'));
    }
}
function readTrackListResponseToTracks(result, callback) {
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
function processChannelListEntry(channelListEntry, callback) {
    xmlParser.parseString(channelListEntry.Metadata, function (err, result) {
        callback(null, {
            title: _.isObject(result['DIDL-Lite']['item']['dc:title']) ? result['DIDL-Lite']['item']['dc:title']._ : result['DIDL-Lite']['item']['dc:title'],
            artwork: _.isObject(result['DIDL-Lite']['item']['upnp:albumArtURI']) ? result['DIDL-Lite']['item']['upnp:albumArtURI']._ : result['DIDL-Lite']['item']['upnp:albumArtURI'],
            uri: _.isObject(result['DIDL-Lite']['item']['res']) ? result['DIDL-Lite']['item']['res']._ : result['DIDL-Lite']['item']['res']
        });
    });
}
function readChannelListResponseToTracks(result, callback) {
    xmlParser.parseString(result['s:Envelope']['s:Body']['u:ReadListResponse'].ChannelList, function (err, result) {
        if (err) {
            callback(err);
        } else {
            var channelList = [];
            if (_.isArray(result.ChannelList.Entry)) {
                _.each(result.ChannelList.Entry, function (channel) {
                    processChannelListEntry(channel, function(err, data) {
                        channelList.push({
                            id: channel.Id,
                            uri: data.uri,
                            title: data.title,
                            artwork: data.artwork
                        });  
                    });
                });
            } else {
                if (result.ChannelList.Entry) {
                    processChannelListEntry(result.ChannelList.Entry, function(err, data) {
                        channelList.push({
                            id: result.ChannelList.Entry.Id,
                            uri: data.uri,
                            title: data.title,
                            artwork: data.artwork
                        });
                    });
                }
            }
            callback(null, channelList);
        }
    });
}
function parseStandbyResponse(result, callback) {
    callback(null, result['s:Envelope']['s:Body']['u:StandbyResponse'].Value);
}
function ensureStatusCode(expectedStatusCode, taskMessage, callback) {
    return function statusChecker(res) {
        if (res.statusCode === expectedStatusCode) {
            callback();
        } else {
            callback(new Error(taskMessage + ": Failed with status " + res.statusCode));
        }
    };
}
exports.Ds = function(deviceUrlRoot, serviceList) {
    this.retrieveTrackDetails = function(idArray, callback) {
        var idArrayString = _.reduce(idArray, function (memo, num) { return memo + num + ' '; }, '');
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'ReadList',
            '<IdList>' + idArrayString + '</IdList>',
            responseParsers.xml(readTrackListResponseToTracks, callback)
        ).on('error', callback);
    };
    this.getTrackIds = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'IdArray',
            '',
            responseParsers.xml(binaryIdArrayToIntList, callback)
        ).on('error', callback);
    };
    this.deleteAll = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'DeleteAll',
            '',
            ensureStatusCode(200, "Delete", callback)
        ).on('error', callback);
    };
    this.enableShuffle = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'SetShuffle',
            '<Value>1</Value>',
            ensureStatusCode(200, "Enable Shuffle", callback)
        ).on('error', callback);
    };
    this.disableShuffle = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'SetShuffle',
            '<Value>0</Value>',
            ensureStatusCode(200, "Disable Shuffle", callback)
        ).on('error', callback);
    };
    this.playFromPlaylistIndex = function (index, callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'SeekIndex',
            '<Value>' + index + '</Value>',
            ensureStatusCode(200, "Play Playlist From Index " + index, callback)
        ).on('error', callback);
    };
    this.playPlaylist = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
            'urn:av-openhome-org:service:Playlist:1',
            'Play',
            '',
            ensureStatusCode(200, "Play Playlist", callback)
        ).on('error', callback);
    };
    this.queueTrack = function(trackDetailsXml, afterId, callback) {
        xmlParser.parseString(trackDetailsXml, function (err, result) {
            if (err) {
                callback(err);
            } else {
                var resources = _.isArray(result['DIDL-Lite'].item.res)
                    ? result['DIDL-Lite'].item.res[0]
                    : result['DIDL-Lite'].item.res;
                var res = _.isObject(resources)
                    ? resources._
                    : resources;
                if (!res) {
                    callback(new Error('Error adding ' + trackDetailsXml));
                } else {
                    upnp.soapRequest(
                        deviceUrlRoot,
                        serviceList['urn:av-openhome-org:service:Playlist:1'].controlUrl,
                        'urn:av-openhome-org:service:Playlist:1',
                        'Insert',
                        '<AfterId>' + afterId + '</AfterId><Uri>' + encode(res) + '</Uri><Metadata>' + encode(trackDetailsXml) + '</Metadata>',
                        responseParsers.xml(parseNewId, callback)
                    ).on('error', callback);
                }
            }
        });
    };
    this.getSources = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Product:1'].controlUrl,
            'urn:av-openhome-org:service:Product:1',
            'SourceXml',
            '',
            responseParsers.xml(toSourceList, callback)
        ).on('error', callback);
    };
    this.changeSource = function (source, callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Product:1'].controlUrl,
            'urn:av-openhome-org:service:Product:1',
            'SetSourceIndex',
            '<Value>'+source+'</Value>',
            ensureStatusCode(200, "Change Source", callback)
        ).on('error', callback);
    };
    this.standbyState = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Product:1'].controlUrl,
            'urn:av-openhome-org:service:Product:1',
            'Standby',
            '',
            responseParsers.xml(parseStandbyResponse, callback)
        ).on('error', callback);
    };
    this.powerOn = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Product:1'].controlUrl,
            'urn:av-openhome-org:service:Product:1',
            'SetStandby',
            '<Value>0</Value>',
            ensureStatusCode(200, "Power On", callback)
        ).on('error', callback);
    };
    this.powerOff = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Product:1'].controlUrl,
            'urn:av-openhome-org:service:Product:1',
            'SetStandby',
            '<Value>1</Value>',
            ensureStatusCode(200, "Power Off", callback)
        ).on('error', callback);
    };
    this.playRadio = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Radio:1'].controlUrl,
            'urn:av-openhome-org:service:Radio:1',
            'Play',
            '',
            ensureStatusCode(200, "Play Radio", callback)
        ).on('error', callback);
    };
    this.getRadioIdArray = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Radio:1'].controlUrl,
            'urn:av-openhome-org:service:Radio:1',
            'IdArray',
            '',
            responseParsers.xml(binaryIdArrayToIntList, callback)
        ).on('error', callback);
    };
    this.retrieveRadioStationDetails = function(idArray, callback) {
        var idArrayString = _.reduce(idArray, function (memo, num) { return memo + num + ' '; }, '');
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Radio:1'].controlUrl,
            'urn:av-openhome-org:service:Radio:1',
            'ReadList',
            '<IdList>' + idArrayString + '</IdList>',
            responseParsers.xml(readChannelListResponseToTracks, callback)
        ).on('error', callback);
    };
    this.setRadioChannel = function(radioChannel, callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Radio:1'].controlUrl,
            'urn:av-openhome-org:service:Radio:1',
            'SetId',
            '<Value>' + radioChannel.id + '</Value><Uri>' + encode(radioChannel.uri) + '</Uri>',
            ensureStatusCode(200, "Set Radio Channel", callback)
        ).on('error', callback);
    };
    this.volumeInc = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Volume:1'].controlUrl,
            'urn:av-openhome-org:service:Volume:1',
            'VolumeInc',
            '',
            ensureStatusCode(200, "Volume Increase", callback)
        ).on('error', callback);
    };
    this.volumeDec = function (callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Volume:1'].controlUrl,
            'urn:av-openhome-org:service:Volume:1',
            'VolumeDec',
            '',
            ensureStatusCode(200, "Volume Decrease", callback)
        ).on('error', callback);
    };
    this.currentTrackDetails = function(callback) {
        upnp.soapRequest(
            deviceUrlRoot,
            serviceList['urn:av-openhome-org:service:Info:1'].controlUrl,
            'urn:av-openhome-org:service:Info:1',
            'Track',
            '',
            responseParsers.xml(toTrack, callback)
        ).on('error', callback);
    };
};