"use strict";

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var async = require('async');

var playlistPath = '/playlists';

function playlistFile(playlistName) {
    return path.join(path.normalize(playlistPath), playlistName + '.m3u');
}

exports.list = function list(callback) {
    if (!playlistPath) {
        callback(new Error('No PlaylistPath Set'));
    } else {
        fs.readdir(path.normalize(playlistPath), function processPlaylistFiles(err, files) {
            if (err) {
                callback(err);
            } else {
                callback(null,
                    _.chain(files)
                        .filter(function (filename) {
                            return filename.match(/\.m3u$/);
                        })
                        .map(function (filename) {
                            return filename.slice(0, -4);
                        })
                        .compact()
                        .value());
            }
        });
    }
};

exports.read = function read(playlistName, callback) {
    fs.readFile(playlistFile(playlistName), { encoding: 'utf8' }, function (err, data) {
        if (data) {
            var tracks = _.chain(data.split(/\n/))
                .compact()
                .map(function (line) {
                    if (line[0] === '#') {
                        return line.slice(1);
                    }
                })
                .compact()
                .value();
            callback(null, tracks);
        } else {
            callback(err);
        }
    });
};
