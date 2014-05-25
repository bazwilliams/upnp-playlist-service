var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});

var minimUriProcessor = function (uri) {
    return decodeURI(uri.replace(/http:.*\/minimserver\/\*/, '').replace(/\*/g,'%'));
}

var processReadListResponse = function (device, trackProcessor, callback) {
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
                        tracks.push(trackProcessor(result.TrackList.Entry.Uri));
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
        console.log(playlistName + '.m3u')
        console.log(tracks);
    };
    upnp.soapRequest(
        device, 
        'Ds/Playlist', 
        'urn:av-openhome.org:service:Playlist:1', 
        'ReadList', 
        '<IdList>'+idArrayString+'</IdList>',
        processReadListResponse(device, minimUriProcessor, storePlaylist)
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