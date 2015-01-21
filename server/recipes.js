var async = require('async');
var playlists = require('./playlists.js');

function delay(milliseconds) {
    return function (callback) {
        setTimeout(callback, milliseconds);
    };
}
exports.play = function play(ds, playlistName, shuffle, callback) {
    if (playlistName) {
        async.waterfall([
            ds.powerOn,
            delay(500),
            shuffle ? ds.enableShuffle : ds.disableShuffle,
            function(iterCallback) {
                playlists.replacePlaylist(ds, playlistName, iterCallback);
            },
            function(trackIds, iterCallback) {
                if (shuffle) {
                    ds.playFromPlaylistIndex(Math.floor((Math.random() * trackIds.length) + 1), iterCallback);
                } else {
                    ds.playFromPlaylistIndex(0, iterCallback);
                }
            }
        ], callback);
    } else {
        async.series([
            ds.powerOn,
            delay(500),
            function(iterCallback) {
                ds.changeSource(1, iterCallback);
            },
            delay(1000),
            ds.playRadio
        ], callback);
    }
}