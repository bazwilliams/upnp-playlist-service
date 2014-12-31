var _ = require('underscore');
var fs = require('fs');
var config = require('../config.js');
var path = require('path');
var async = require('async');

function playlistFile(playlistName) {
    return path.join(path.normalize(config.playlistPath), playlistName + '.m3u');
}

function relative(track) {
    return path.relative(path.normalize(config.playlistPath), track.track);
}

function combine(lines, callback) {
    async.reduce(lines, '', function appendLine(memo, item, iterCallback){
        iterCallback(null, memo + item + '\n')
    }, callback);
}

exports.read = function (playlistName, callback) {
    fs.readFile(playlistFile(playlistName), { encoding: 'utf8' }, function (err, data) {
        if (data) {
            var tracksInReverse = _.chain(data.split(/\n/))
                .compact()
                .map(function (line) {
                    if (line[0] === '#') {
                        return line.slice(1);
                    }
                })
                .compact()
                .reverse()
                .value();
            callback(null, tracksInReverse);
        } else {
            callback(err);
        }
    });
};

exports.write = function (tracks, playlistName, callback) {
    async.mapSeries(tracks, function(track, iterCallback) {
        fs.stat(track.track, function(err, stats) {
            if (stats && stats.isFile()) {
                iterCallback(null, relative(track.track) + '\n' + '#' + track.metadata);
            }
            iterCallback(null, '#' + track.metadata);
        });
    }, function writeLines(err, lines) {
        combine(lines, function writeFile(err, data) {
            if (err) {
                callback(err);
            } else {
                fs.writeFile(playlistFile(playlistName), data, { flag: 'wx', encoding: 'utf8' }, callback);
            }
        });
    });
};