var _ = require('underscore');
var fs = require('fs');
var config = require('../config.js');
var path = require('path');
var async = require('async');

exports.read = function (playlistName, callback) {
    var playlistLocation = path.normalize(config.playlistPath);
    var playlistFile = path.join(playlistLocation, playlistName + '.m3u');
    console.log("Attempting to read " + playlistFile);
    fs.readFile(playlistFile, { encoding: 'utf8' }, function (err, data) {
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
    var playlistLocation = path.normalize(config.playlistPath);
    var data = '';
    async.eachSeries(tracks, function(track, iterCallback) {
        fs.stat(track.track, function(err, stats) {
            if (stats && stats.isFile()) {
                var relTrack = path.relative(playlistLocation, track.track);
                data += relTrack + '\n';
            }
            data += '#' + track.metadata + '\n';
            iterCallback();
        });
    }, function () {
        var playlistFile = path.join(playlistLocation, playlistName + '.m3u');
        fs.writeFile(playlistFile, data, { flag: 'wx', encoding: 'utf8' }, callback);
    });
};