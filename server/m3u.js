var _ = require('underscore');
var fs = require('fs');
var config = require('../config.js');
var path = require('path');
var async = require('async');

function playlistFile(playlistName) {
    return path.join(path.normalize(config.playlistPath), playlistName + '.m3u');
}

function relative(track) {
    return path.relative(path.normalize(config.playlistPath), track);
}

function combine(lines, callback) {
    async.reduce(lines, '', function appendLine(memo, item, iterCallback){
        iterCallback(null, memo + item + '\n')
    }, callback);
}

exports.list = function list(callback) {
    fs.readdir(path.normalize(config.playlistPath), function processPlaylistFiles(err, files) {
        if (err) {
            callback(err);
        } else {
            callback(null, 
                _.chain(files)
                    .filter(function (filename) { return filename.match(/\.m3u$/); })
                    .map(function (filename) { return filename.slice(0,-4); })
                    .compact()
                    .value());
        }
    });
}

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

exports.write = function write(tracks, playlistName, callback) {
    async.map(
        tracks, 
        function (track, iterCallback) {
            fs.stat(track.track, function (err, stats) {
                if (stats && stats.isFile()) {
                    iterCallback(null, relative(track.track) + '\n' + '#' + track.metadata);
                } else {
                    iterCallback(null, '#' + track.metadata);
                }
            });
        }, 
        function writeLines(err, lines) {
            combine(lines, function writeFile(err, data) {
                if (err) {
                    callback(err);
                } else {
                    fs.writeFile(playlistFile(playlistName), data, { flag: 'wx', encoding: 'utf8' }, callback);
                }
            });
        }
    );
};

exports.append = function append(track, playlistName, callback) {
    async.waterfall([
        function (iterCallback) {
            fs.stat(track.track, function (err, stats) {
                if (stats && stats.isFile()) {
                    iterCallback(null, relative(track.track) + '\n' + '#' + track.metadata);
                }
                iterCallback(null, '#' + track.metadata);
            });
        }], function appendLine(err, line) {
            if (err) {
                callback(err);
            } else {
                fs.appendFile(playlistFile(playlistName), line + '\n', { encoding: 'utf8' }, callback);
            }
        });
};
