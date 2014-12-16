var async = require('async');
var m3u = require('./m3u.js');
var trackProcessor = require('./trackprocessor.js');
var Ds = require('./ds.js').Ds;

exports.PlaylistManager = function(device) {
    var ds = new Ds(device);
    function storePlaylist(tracks, playlistName, callback) {
        async.mapSeries(tracks, function (track, iterCallback) {
            iterCallback(null, {
                track: trackProcessor.translate(track.track),
                metadata: track.metadata
            });
        }, function(err, transformedTracks) {
            if (err) {
                callback(err);
            } else {
                m3u.write(transformedTracks, playlistName, callback);
            }
        });
    }
    function queueAllTracks(tracks, callback) {
        async.mapSeries(
            tracks,
            function (trackXml, iterCallback) {
                ds.queueTrack(trackXml, 0, iterCallback);
            },
            callback);
    }
    this.replacePlaylist = function (playlistName, callback) {
        async.series({
            "delete": ds.deleteAll,
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
            ds.getTrackIds,
            ds.retrieveTrackDetails
        ], function (err, results) {
            if (err) {
                callback(err);
            }
            if (results) {
                storePlaylist(results, playlistName, callback);
            }
        });
    };
};