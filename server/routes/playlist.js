var manager = require('../devicemanager.js');
var playlists = require('../playlists.js');
var m3u = require('../m3u.js');
var recipes = require('../recipes.js');

function createPlaylistResponseHandler(res) {
    return function handler(err, results) {
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
    }
}
function responseHandler(res) {
    return function handler(err, results) {
        if (err) {
            console.error(err.stack);
            res.status(400).send(err.message);
        } else {
            res.status(200).send(results);
        }
    }
}
exports.listPlaylists = function listPlaylists(req, res) {
    m3u.list(responseHandler(res));
};
exports.addToPlaylist = function addToPlaylist(req, res) {
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(req.params.uuid);
    if (device && playlistName) {
        playlists.appendCurrentTrack(device.ds, playlistName, responseHandler(res));
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};
exports.storePlaylist = function storePlaylist(req, res) {
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(req.params.uuid);
    if (device && playlistName) {
        playlists.savePlaylist(device.ds, playlistName, createPlaylistResponseHandler(res));
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};
exports.playMusic = function playMusic(req, res) {
    var device = manager.getDevice(req.params.uuid);
    if (device) {
        recipes.play(device.ds, req.body.playlistName ? 0 : 1, req.body.playlistName, req.body.shuffle || false, responseHandler(res));
    } else {
        res.status(404).send('Invalid uuid. ');
    }
};