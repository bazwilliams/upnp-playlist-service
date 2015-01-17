var async = require('async');
var m3u = require('./m3u.js');
var trackProcessor = require('./trackprocessor.js');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var _ = require('underscore');

function storePlaylist(tracks, playlistName, callback) {
    async.mapSeries(tracks, function processTrack(track, iterCallback) {
        iterCallback(null, {
            track: trackProcessor.translate(track.track),
            metadata: track.metadata
        });
    }, function writeM3u(err, transformedTracks) {
        if (err) {
            callback(err);
        } else {
            m3u.write(transformedTracks, playlistName, callback);
        }
    });
}
function queueAllTracks(ds) {
    return function queueAllTracksGivenDs(tracks, callback) {
        async.mapSeries(
            tracks.reverse(),
            function queueTrackAtFront(trackXml, iterCallback) {
                ds.queueTrack(trackXml, 0, iterCallback);
            },
            function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
    };
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
            m3u.append({
                    track: trackProcessor.translate(track.track),
                    metadata: track.metadata
                },
                playlistName,
                iterCallback);
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
    async.waterfall([
        ds.deleteAll,
        function readM3u(iterCallback) {
            m3u.read(playlistName, iterCallback);
        },
        queueAllTracks(ds),
        ds.playPlaylistFromStart
    ], callback);
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