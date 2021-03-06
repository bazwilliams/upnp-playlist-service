"use strict";

var async = require('async');
var playlists = require('./playlists.js');

function ensureOn(ds) {
    return function checkStandbyState(callback) {
        async.waterfall([
            ds.standbyState,
            function switchOnIfOff(currentStandbyState, iterCallback) {
                if (currentStandbyState === '1') {
                    ds.powerOn(function(err, results) {
                        callback();
                    });
                } else {
                    callback();
                }
            }
        ], callback);
    };
}
function returnStandbyState(standbyState, callback) {
    return function powerResponseHandler(err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, { standbyState: standbyState });
        }
    };
}
exports.volumeUp = function volumeUp(ds, delta, callback) {
    async.times(delta, function(n, next) {
        ds.volumeInc(next);
    }, callback);
};
exports.volumeDown = function volumeDown(ds, delta, callback) {
    async.times(delta, function(n, next) {
        ds.volumeDec(next);
    }, callback);
};
exports.toggleStandby = function toggleStandby(ds, callback) {
    async.waterfall([
        ds.standbyState,
        function togglePowerState(currentStandbyState, iterCallback) {
            if (currentStandbyState === '1') {
                ds.powerOn(returnStandbyState(0, iterCallback));
            } else {
                ds.powerOff(returnStandbyState(1, iterCallback));
            }
        }
    ], callback);
};
exports.play = function play(ds, sourceId, playlistName, shuffle, radioChannel, callback) {
    var pipeline = [
        ensureOn(ds),
        function changeSource(iterCallback) {
            ds.changeSource(sourceId, iterCallback);
        }
    ];
    if (radioChannel) {
        pipeline.push(function setRadioChannel(iterCallback) {
            ds.setRadioChannel(radioChannel, iterCallback);
        });
        pipeline.push(ds.playRadio);
    } else if (playlistName) {
        pipeline.push(shuffle ? ds.enableShuffle : ds.disableShuffle);
        pipeline.push(function replacePlaylist(iterCallback) {
            playlists.replacePlaylist(ds, playlistName, iterCallback);
        });
        pipeline.push(function startPlayback(trackIds, iterCallback) {
            if (shuffle) {
                ds.playFromPlaylistIndex(Math.floor((Math.random() * trackIds.length) + 1), iterCallback);
            } else {
                ds.playFromPlaylistIndex(0, iterCallback);
            }
        });
    }

    async.waterfall(pipeline, callback);
};
exports.listRadioStations = function listRadioStations(ds, callback) {
    async.waterfall([ds.getRadioIdArray, ds.retrieveRadioStationDetails], callback);
};