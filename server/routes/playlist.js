var manager = require('../devicemanager.js');
var playlists = require('../playlists.js');
var m3u = require('../m3u.js');

exports.listPlaylists = function (req, res) {
    m3u.list(function (err, results) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(results);
        }
    });
}

exports.storePlaylist = function (req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        playlists.savePlaylist(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.sendStatus(201);
            }
        });
    } else {
        res.sendStatus(404);
    }
};
exports.replacePlaylist = function (req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.body.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        playlists.replacePlaylist(device.ds, playlistName, function responseHandler(err, results) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(404);
    }
};