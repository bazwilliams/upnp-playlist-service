var manager = require('../devicemanager.js');
var playlists = require('../playlists.js');
var m3u = require('../m3u.js');

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
exports.addToPLaylist = function addToPLaylist(req, res) {
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
        res.sendStatus(404);
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
        res.sendStatus(404);
    }
};
exports.playMusic = function playMusic(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.body.playlistName;
    var device = manager.getDevice(uuid);
    if (device && playlistName) {
        playlists.replacePlaylist(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                console.error(err.stack);
                res.status(400).send(err.message);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(404);
    }
};