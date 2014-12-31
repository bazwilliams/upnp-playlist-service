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
            function queueTrackAtFront(trackXml, callback) {
                ds.queueTrack(trackXml, 0, callback);
            },
            callback);
    };
}
exports.replacePlaylist = function (ds, playlistName, callback) {
    async.waterfall([
        ds.deleteAll,
        function readM3u(iterCallback) {
            m3u.read(playlistName, iterCallback);
        },
        queueAllTracks(ds)
    ], callback);
};
exports.savePlaylist = function (ds, playlistName, callback) {
    async.waterfall([
        ds.getTrackIds,
        ds.retrieveTrackDetails
    ], function storeTrackDetails(err, results) {
        if (err) {
            callback(err);
        }
        if (results) {
            storePlaylist(results, playlistName, callback);
        }
    });
};