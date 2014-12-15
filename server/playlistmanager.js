
var _ = require('underscore');
var async = require('async');
var config = require('../config.js');
var m3u = require('./m3u.js');
var trackProcessor = require('./trackprocessor.js');
var Ds = require('./ds.js').Ds;

exports.PlaylistManager = function(device) {
    var ds = new Ds(device);
    function queueAllTracks(tracks, callback) {
        async.mapSeries(
            tracks, 
            function (trackXml, iterCallback) {
                ds.queueTrack(trackXml, 0, iterCallback);
            }, 
            callback);
    };
    this.replacePlaylist = function (playlistName, callback) {
        async.series({
            "delete": function (iterCallback) {
                ds.deleteAll(iterCallback);
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
            ds.getTrackIds,
            ds.retrieveTrackDetails
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