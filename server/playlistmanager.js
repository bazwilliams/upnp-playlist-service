var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var path = require('path');
var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var config = require('../config.js');

var uriTrackProcessor = function(prefix) {
    return function (uri) {
        if (uri.indexOf('http:') === 0) {
            return path.join(prefix, decodeURIComponent(uri.replace(/http:.*\/minimserver\/\*\/[^\/.]*\//, '').replace(/\*/g,'%')));
        } else {
            return uri;
        }
    };
}
var trackProcessor = uriTrackProcessor(config.musicRoot);

var writeM3u = function (tracks, playlistName) {
    var playlistLocation = path.normalize(config.playlistPath);
    var data = '';
    _.each(tracks, function(track) {
        if (fs.exists(track.track)) {
            var relTrack = path.relative(playlistLocation, track.track);
            data += '#' + track.metadata + '\n';
            data += relTrack + '\n';
        } else {
            data += '#' + track.metadata + '\n';
        }
    });
    var playlistFile = path.join(playlistLocation, playlistName + '.m3u');
    fs.writeFile(playlistFile, data, {flag: 'wx', encoding: 'utf8'});
};

var readM3u = function(playlistName, trackCallback) {
    var playlistLocation = path.normalize(config.playlistPath);
    var playlistFile = path.join(playlistLocation, playlistName + '.m3u');
    fs.readFile(playlistFile, {encoding: 'utf8'}, function(err, data) {
        var tracksInReverse = _.chain(data.split(/\n/))
            .compact()
            .reverse()
            .map(function (line) {
                return line.slice(1);
            })
            .value();
        _.each(tracksInReverse, function(line) {
            trackCallback(line);
        });
    });
}

var processReadListResponse = function (device, callback) {
    return function(res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            xmlParser.parseString(body, function (err, result) {
                xmlParser.parseString(result['s:Envelope']['s:Body']['u:ReadListResponse'].TrackList, function (err, result) {
                    var tracks = [];
                    if (_.isArray(result.TrackList.Entry)) {
                        _.each(result.TrackList.Entry, function (track) {
                            tracks.push({
                                track: trackProcessor(track.Uri),
                                metadata: track.Metadata
                            });
                        });
                    } else {
                        if (result.TrackList.Entry) {
                            tracks.push({
                                track: trackProcessor(result.TrackList.Entry.Uri),
                                metadata: track.Metadata
                            });
                        }
                    }
                    callback(tracks);
                });
            });
        });
    };
};

var generatePlaylist = function (device, idArray, playlistName) {
    var idArrayString = '';
    _.each(idArray, function (id) {
        idArrayString += (id + ' ');
    });
    var storePlaylist = function (tracks) {
        writeM3u(tracks, playlistName);
    };
    upnp.soapRequest(
        device, 
        'Ds/Playlist', 
        'urn:av-openhome.org:service:Playlist:1', 
        'ReadList', 
        '<IdList>'+idArrayString+'</IdList>',
        processReadListResponse(device, storePlaylist)
    );
}

var processPlaylistResponse = function (device, playlistName) {
    return function(res) {
        var body = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            xmlParser.parseString(body, function (err, result) {
                var buffer = new Buffer(result['s:Envelope']['s:Body']['u:IdArrayResponse'].Array, 'base64');
                var arrayList = [];
                var binaryList = binary.parse(buffer);
                _.each(_.range(buffer.length / 4), function () {
                    arrayList.push(binaryList.word32bu('a').vars.a);
                });
                generatePlaylist(device, arrayList, playlistName);
            });
        });
    };
};

var deleteAll = function(device, callback) {
        upnp.soapRequest(
            device, 
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1', 
            'DeleteAll', 
            '',
            callback
        );
}

var enqueueItemAtStart = function(device) {
    return function(trackDetailsXml) {
        xmlParser.parseString(trackDetailsXml, function (err, result) {
            var trackUri = result['DIDL-Lite']['item']['res']
                .replace(/&/g, "&amp;");
            var metadata = trackDetailsXml
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
            upnp.soapRequest(
                device, 
                'Ds/Playlist',
                'urn:av-openhome.org:service:Playlist:1', 
                'Insert', 
                '<AfterId>0</AfterId><Uri>'+trackUri+'</Uri><Metadata>'+metadata+'</Metadata>'
            );
        });
    };
}

exports.PlaylistManager = function(device) {
    this.replacePlaylist = function (playlistName) {
        deleteAll(device, function () {
            readM3u(playlistName, enqueueItemAtStart(device));
        });
    };
    this.savePlaylist = function (playlistName) {
        upnp.soapRequest(
            device, 
        'Ds/Playlist', 
        'urn:av-openhome.org:service:Playlist:1', 
        'IdArray', 
        '',
        processPlaylistResponse(device, playlistName)
        );
    };
};