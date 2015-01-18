var manager = require('../devicemanager.js');
var playlists = require('../playlists.js');
var m3u = require('../m3u.js');
var async = require('async');

function delay(milliseconds) {
    return function (callback) {
        setTimeout(callback, milliseconds);
    };
}

exports.listPlaylists = function listPlaylists(req, res) {
    m3u.list(function (err, results) {
        if (err) {
            console.error(err.stack);
            res.status(400).send(err.message);
        } else {
            res.status(200).send(results);
        }
    });
};
exports.addToPlaylist = function addToPlaylist(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device && playlistName) {
        playlists.appendCurrentTrack(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                console.error(err.stack);
                res.status(400).send(err.message);
            } else {
                res.status(200).send(results);
            }
        });
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};
exports.storePlaylist = function storePlaylist(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device && playlistName) {
        playlists.savePlaylist(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                console.error(err.stack);
                if (err.code === 'EEXIST') {
                    res.status(409).send('Playlist with that name already exists. ');
                } else {
                    res.status(400).send(err.message);
                }
            } else {
                res.sendStatus(201);
            }
        });
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};
exports.playMusic = function playMusic(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.body.playlistName;
    var shuffle = req.body.shuffle || false;
    var device = manager.getDevice(uuid);
    if (device) {
        if (playlistName) {
            async.series([
                device.ds.powerOn,
                function(iterCallback) {
                    playlists.replacePlaylist(device.ds, playlistName, iterCallback);
                },
                shuffle ? device.ds.enableShuffle : device.ds.disableShuffle,
                shuffle ? device.ds.play : device.ds.playPlaylistFromStart
            ], function responseHandler(err, results) {
                if (err) {
                    console.error(err.stack);
                    res.status(400).send(err.message);
                } else {
                    res.sendStatus(200);
                }
            });
        } else {
            async.series([
                device.ds.powerOn,
                function(iterCallback) {
                    device.ds.changeSource(1, iterCallback);
                },
                delay(1000),
                device.ds.playRadio
            ], function responseHandler(err, results) {
                if (err) {
                    console.error(err.stack);
                    res.status(400).send(err.message);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};