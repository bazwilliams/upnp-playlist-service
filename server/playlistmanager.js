var async = require('async');
var m3u = require('./m3u.js');
var trackProcessor = require('./trackprocessor.js');
var Ds = require('./ds.js').Ds;

exports.PlaylistManager = function(device) {
    var ds = new Ds(device);
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
    function queueTrackAtFront(trackXml, callback) {
        ds.queueTrack(trackXml, 0, callback);
    }
    function queueAllTracks(tracks, callback) {
        async.mapSeries(tracks, queueTrackAtFront, callback);
    }
    this.replacePlaylist = function (playlistName, callback) {
        async.waterfall([
            ds.deleteAll,
            function readM3u(iterCallback) {
                m3u.read(playlistName, iterCallback);
            },
            queueAllTracks
        ], callback);
    };
    this.savePlaylist = function (playlistName, callback) {
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
};