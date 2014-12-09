var _ = require('underscore');
var fs = require('fs');
var config = require('../config.js');
var path = require('path');

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
            console.log(err);
        }
    });
};