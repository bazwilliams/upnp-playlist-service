var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var async = require('async');
var config = require('../config.js');
var m3u = require('./m3u.js');

var uriTrackProcessor = function(prefix) {
    return function (uri) {
        if (uri.indexOf('http:') === 0) {
            return path.join(prefix, decodeURIComponent(uri.replace(/http:.*\/minimserver\/\*\/[^\/.]*\//, '').replace(/\*/g, '%')));
        } else {
            return uri;
        }
    };
};

var processReadListResponse = function (device, callback) {
    var trackProcessor = uriTrackProcessor(config.musicRoot);
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
                    if (_.isArray(result.TrackList.Entry)) {
                        _.each(result.TrackList.Entry, function (track) {
                            tracks.push({
                                track: trackProcessor(track.Uri),
                                metadata: track.Metadata
                            });
                        });
                    } else {
                        if (result.TrackList.Entry) {
                            tracks.push({
                                track: trackProcessor(result.TrackList.Entry.Uri),
                                metadata: result.TrackList.Entry.Metadata
                            });
                        }
                    }
                    callback(tracks);
                });
            });
        });
    };
};

var generatePlaylist = function (device, idArray, playlistName, callback) {
    var idArrayString = '';
    _.each(idArray, function (id) {
        idArrayString += (id + ' ');
    });
    var storePlaylist = function (tracks) {
        m3u.write(tracks, playlistName, callback);
    };
    upnp.soapRequest(
        device,
        'Ds/Playlist',
        'urn:av-openhome.org:service:Playlist:1',
        'ReadList',
        '<IdList>'+idArrayString+'</IdList>',
        processReadListResponse(device, storePlaylist)
    );
};

var processPlaylistResponse = function (device, playlistName, callback) {
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
                generatePlaylist(device, arrayList, playlistName, callback);
            });
        });
    };
};

exports.PlaylistManager = function(device) {
    function deleteAll(callback) {
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'DeleteAll',
            '',
            function (res) {
                if (res.statusCode == 200) {
                    callback();
                } else {
                    callback(new Error("Delete failed with status " + res.statusCode));
                }
            }
        );
    };
    function queueTrack(trackDetailsXml, afterId, callback) {
        xmlParser.parseString(trackDetailsXml, function (err, result) {
            var trackUri = result['DIDL-Lite']['item']['res']
                .replace(/&/g, "&amp;");
            var metadata = trackDetailsXml
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
            upnp.soapRequest(
                device,
                'Ds/Playlist',
                'urn:av-openhome.org:service:Playlist:1',
                'Insert',
                '<AfterId>' + afterId + '</AfterId><Uri>' + trackUri + '</Uri><Metadata>' + metadata + '</Metadata>',
                function (res) {
                    if (res.statusCode == 200) {
                        callback();
                    } else {
                        callback(new Error("Queue failed with " + res.statusCode));
                    }
                }
            );
        });
    };
    this.replacePlaylist = function (playlistName, callback) {
        async.series({
            "delete": function (iterCallback) {
                deleteAll(iterCallback);
            },
            "tracks": function (iterCallback) {
                m3u.read(playlistName, iterCallback);
            }
        }, function (err, results) {
            if (err) {
                callback(err);
            } else {
                async.mapSeries(results.tracks, function (trackXml, iterCallback) {
                    queueTrack(trackXml, 0, iterCallback);
                }, callback);
            }
        });
    };
    this.savePlaylist = function (playlistName, callback) {
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'IdArray',
            '',
            processPlaylistResponse(device, playlistName, callback)
        );
    };
};