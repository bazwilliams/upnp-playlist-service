var async = require('async');
var m3u = require('./m3u.js');
var trackProcessor = require('./trackprocessor.js');

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
exports.appendCurrentTrack = function (ds, playlistName, callback) {
    async.waterfall([
        ds.currentTrackDetails,
        function addToM3u(track, iterCallback) {
            if (track.track) {
                m3u.append({
                    track: trackProcessor.translate(track.track),
                    metadata: track.metadata
                }, playlistName, iterCallback);
            } else {
                callback(new Error('No track found to append'));
            }
        }
        ], callback)
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