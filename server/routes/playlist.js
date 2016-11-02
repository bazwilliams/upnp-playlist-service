"use strict";

const manager = require('openhome-devices-manager');
const playlists = require('../playlists.js');
const m3u = require('../playliststore.js');
const recipes = require('../recipes.js');
const Searcher = require('../searcher.js');

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
    };
}
function responseHandler(res) {
    return function handler(err, results) {
        if (err) {
            console.error(err.stack);
            res.status(400).send(err.message);
        } else {
            res.status(200).send(results);
        }
    };
}
exports.listPlaylists = function listPlaylists(req, res) {
    let respond = responseHandler(res);
    m3u.list((err, playlists) => {
        if (err) {
            respond(err);
        } else {
            if (req.query.search) {
                let searcher = new Searcher(playlists);
                respond(null, searcher.search(req.query.search, 1));
            }
            else {
                respond(null, playlists);
            }
        }
    });
};
exports.addToPlaylist = function addToPlaylist(req, res) {
    let playlistName = req.params.playlistName;
    let device = manager.getDevice(req.params.uuid);
    if (device && playlistName) {
        playlists.appendCurrentTrack(device.ds, playlistName, responseHandler(res));
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};
exports.storePlaylist = function storePlaylist(req, res) {
    let playlistName = req.params.playlistName;
    let device = manager.getDevice(req.params.uuid);
    if (device && playlistName) {
        playlists.savePlaylist(device.ds, playlistName, createPlaylistResponseHandler(res));
    } else {
        res.status(404).send('Invalid uuid or playlist name. ');
    }
};
exports.playMusic = function playMusic(req, res) {
    let device = manager.getDevice(req.params.uuid);
    if (device) {
        recipes.play(device.ds, req.body.playlistName ? 0 : 1, req.body.playlistName, req.body.shuffle || false, null, responseHandler(res));
    } else {
        res.status(404).send('Invalid uuid. ');
    }
};