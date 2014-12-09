var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
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

var trackProcessor = uriTrackProcessor(config.musicRoot);

var writeM3u = function (tracks, playlistName) {
    var playlistLocation = path.normalize(config.playlistPath);
    var data = '';
    async.eachSeries(tracks, function(track, callback) {
        fs.stat(track.track, function(err, stats) {
            if (stats && stats.isFile()) {
                var relTrack = path.relative(playlistLocation, track.track);
                data += relTrack + '\n';
            }
            data += '#' + track.metadata + '\n';
            callback();
        });
    }, function () {
        var playlistFile = path.join(playlistLocation, playlistName + '.m3u');
        fs.writeFile(playlistFile, data, {flag: 'wx', encoding: 'utf8'});
    });
};

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
                                metadata: track.Metadata
                            });
                        }
                    }
                    callback(tracks);
                });
            });
        });
    };
};

var generatePlaylist = function (device, idArray, playlistName) {
    var idArrayString = '';
    _.each(idArray, function (id) {
        idArrayString += (id + ' ');
    });
    var storePlaylist = function (tracks) {
        writeM3u(tracks, playlistName);
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
                    if (res.statusCode === 200) {
                        callback();
                    }
                    callback("Queue failed with " + res.statusCode);
                }
            );
        });
    };
    this.replacePlaylist = function (playlistName) {
        async.series({
            "delete": function (callback) {
                deleteAll(callback);
            },
            "tracks": function (callback) {
                m3u.read(playlistName, callback);
            }
        }, function (err, results) {
            async.mapSeries(results.tracks, function (trackXml, callback) {
                queueTrack(trackXml, 0, callback);
            });
        });
    };
    this.savePlaylist = function (playlistName) {
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'IdArray',
            '',
            processPlaylistResponse(device, playlistName)
        );
    };
};