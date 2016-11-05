"use strict";

var async = require('async');
var m3u = require('./playliststore.js');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var _ = require('underscore');

function storePlaylist(tracks, playlistName, callback) {
    async.mapSeries(tracks, function processTrack(track, iterCallback) {
        iterCallback(null, track.metadata);
    }, function writeM3u(err, transformedTracks) {
        if (err) {
            callback(err);
        } else {
            m3u.write(transformedTracks, playlistName, callback);
        }
    });
}
function queueAllTracks(ds, tracks, callback) {
    if (!_.isArray(tracks)) {
        callback(new Error(`Tracks should be an array (got ${tracks})`));
    } else {
        async.mapSeries(
            _.clone(tracks).reverse(),
            function queueTrackAtFront(trackXml, iterCallback) {
                ds.queueTrack(trackXml, 0, iterCallback);
            },
            function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
    }
}
function elementText(element) {
    return _.isObject(element) ? element._ : element;
}
function first(element) {
    return _.isArray(element) ? element[0] : element;
}
exports.appendCurrentTrack = function (ds, playlistName, callback) {
    async.waterfall([
        ds.currentTrackDetails,
        function addToM3u(track, iterCallback) {
            m3u.append(track.metadata, playlistName, iterCallback);
        }
        ], function parseTrackDetails(err, metadata) {
            if (err) {
                callback(err);
            } else {
                xmlParser.parseString(metadata, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (result['DIDL-Lite'].item) {
                            callback(null, {
                                artist: elementText(first(result['DIDL-Lite'].item['upnp:artist'])),
                                title: elementText(first(result['DIDL-Lite'].item['dc:title'])),
                                albumArt: elementText(first(result['DIDL-Lite'].item['upnp:albumArtURI'])),
                                album: elementText(first(result['DIDL-Lite'].item['upnp:album']))
                            });
                        } else {
                            callback();
                        }
                    }
                });
            }
        });
};
exports.replacePlaylist = function (ds, playlistName, callback) {
    m3u.read(playlistName, function(err, data) {
        if (err) {
            callback(err);
        } else if (!data) {
            callback(new Error(`No playlist found called ${playlistName}`));
        } else {
            async.waterfall([
                ds.deleteAll,
                (iterCallback) => queueAllTracks(ds, data, iterCallback)
            ], callback);
        }
    });
};
exports.savePlaylist = function (ds, playlistName, callback) {
    async.waterfall([
        ds.getTrackIds,
        ds.retrieveTrackDetails
    ], function storeTrackDetails(err, results) {
        if (err) {
            callback(err);
        } else {
            storePlaylist(results, playlistName, callback);
        }
    });
};
