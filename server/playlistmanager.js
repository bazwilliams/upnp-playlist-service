var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});
var path = require('path');
var fs = require('fs');

var minimUriProcessor = function(prefix) {
    return function (uri) {
        return path.join(prefix, decodeURI(uri.replace(/http:.*\/minimserver\/\*\//, '').replace(/\*/g,'%')));
    };
}
var trackProcessor = minimUriProcessor('/mnt/media/');

var writeM3u = function (tracks, playlistName) {
    var playlistLocation = path.normalize('/mnt/media/music/Playlists');
    var data = '';
    _.each(tracks, function(track) {
        var relTrack = path.relative(playlistLocation, track);
        data += relTrack + '\n';
    });
    var playlistFile = path.join(playlistLocation, playlistName + '.m3u');
    fs.writeFile(playlistFile, data, {flag: 'wx'});
};

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
                            tracks.push(trackProcessor(track.Uri));
                        });
                    } else {
                        if (result.TrackList.Entry) {
                            tracks.push(trackProcessor(result.TrackList.Entry.Uri));
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

var savePlaylist = function (device, playlistName) {
    upnp.soapRequest(
        device, 
        'Ds/Playlist', 
        'urn:av-openhome.org:service:Playlist:1', 
        'IdArray', 
        '',
        processPlaylistResponse(device, playlistName)
    );
}
exports.savePlaylist = savePlaylist;