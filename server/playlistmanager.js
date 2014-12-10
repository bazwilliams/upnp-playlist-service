var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var async = require('async');
var config = require('../config.js');
var m3u = require('./m3u.js');
var trackProcessor = require('./trackprocessor.js');

exports.PlaylistManager = function(device) {
    function retrieveTrackDetails(idArray, callback) {
        var idArrayString = '';
        _.each(idArray, function (id) {
            idArrayString += (id + ' ');
        });
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'ReadList',
            '<IdList>' + idArrayString + '</IdList>',
            function(res) {
                var body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.once('end', function () {
                    xmlParser.parseString(body, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
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
                    });
                });
            }
        );
    };
    function getTrackIds(callback) {
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'IdArray',
            '',
            function (res) {
                var body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.once('end', function () {
                    xmlParser.parseString(body, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            var buffer = new Buffer(result['s:Envelope']['s:Body']['u:IdArrayResponse'].Array, 'base64');
                            var arrayList = [];
                            var binaryList = binary.parse(buffer);
                            _.each(_.range(buffer.length / 4), function () {
                                arrayList.push(binaryList.word32bu('a').vars.a);
                            });
                            callback(null, arrayList);
                        }
                    });
                });
            }
        );
    };
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
            if (err) {
                callback(err);
            } else {
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
            }
        });
    };
    function queueAllTracks(tracks, callback) {
        async.mapSeries(
            tracks, 
            function (trackXml, iterCallback) {
                queueTrack(trackXml, 0, iterCallback);
            }, 
            callback);
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
            }
            if (results && results.tracks) {
                queueAllTracks(results.tracks, callback);
            }
        });
    };
    this.savePlaylist = function (playlistName, callback) {
        async.waterfall([
            getTrackIds,
            retrieveTrackDetails
        ], function (err, trackDetails) {
            if (err) {
                callback(err);
            } else {
                var transformedTracks = _.map(trackDetails, function(track) {
                    return {
                        track: trackProcessor.translate(track.track),
                        metadata: track.metadata
                    }
                });
                m3u.write(transformedTracks, playlistName, callback);
            }
        });
    };
};