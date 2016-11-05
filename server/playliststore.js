"use strict";

let _ = require('underscore');
let persist = require('node-persist');
let async = require('async');

function combine(lines, callback) {
    async.reduce(lines, '', function appendLine(memo, item, iterCallback){
        iterCallback(null, memo + item + '\n');
    }, callback);
}

exports.list = function list(callback) {
    let playlists = persist.valuesWithKeyMatch(/\/playlists\/.*/);
    callback(null,_.pluck(playlists, 'name'));
};

function read(playlistName, callback) {
    persist.getItem(`/playlists/${playlistName}`, function (err, data) {
        if (data) {
            callback(null, data.tracks);
        } else {
            callback(err);
        }
    });
}
exports.read = read;

function write(tracks, playlistName, callback) {
    persist.setItem(`/playlists/${playlistName}`, { name: playlistName, tracks: tracks }, callback);
}
exports.write = write;

exports.append = function append(track, playlistName, callback) {
    read(playlistName, function(err, data) {
        data.push(track);
        write(data, playlistName, function(err, data) {
            if (data) {
                callback(null, track);
            } else {
                callback(err);
            }
        });
    });
};
