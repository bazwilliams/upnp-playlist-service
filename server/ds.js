var _ = require('underscore');
var upnp = require("./lib/upnp.js");
var binary = require('binary');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});

exports.Ds = function(device) {
    this.retrieveTrackDetails = function(idArray, callback) {
        var idArrayString = '';
        _.each(idArray, function (id) {
            idArrayString += (id + ' ');
        });
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'ReadList',
            '<IdList>' + idArrayString + '</IdList>',
            function(res) {
                var body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.once('end', function () {
                    xmlParser.parseString(body, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            xmlParser.parseString(result['s:Envelope']['s:Body']['u:ReadListResponse'].TrackList, function (err, result) {
                                if (err) {
                                    callback(err);
                                } else {
                                    var tracks = [];
                                    if (_.isArray(result.TrackList.Entry)) {
                                        _.each(result.TrackList.Entry, function (track) {
                                            tracks.push({
                                                track: track.Uri,
                                                metadata: track.Metadata
                                            });
                                        });
                                    } else {
                                        if (result.TrackList.Entry) {
                                            tracks.push({
                                                track: result.TrackList.Entry.Uri,
                                                metadata: result.TrackList.Entry.Metadata
                                            });
                                        }
                                    }
                                    callback(null, tracks);
                                }
                            });
                        }
                    });
                });
            }
        );
    };
    this.getTrackIds = function(callback) {
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'IdArray',
            '',
            function (res) {
                var body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.once('end', function () {
                    xmlParser.parseString(body, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            var buffer = new Buffer(result['s:Envelope']['s:Body']['u:IdArrayResponse'].Array, 'base64');
                            var arrayList = [];
                            var binaryList = binary.parse(buffer);
                            _.each(_.range(buffer.length / 4), function () {
                                arrayList.push(binaryList.word32bu('a').vars.a);
                            });
                            callback(null, arrayList);
                        }
                    });
                });
            }
        );
    };
    this.deleteAll = function(callback) {
        upnp.soapRequest(
            device,
            'Ds/Playlist',
            'urn:av-openhome.org:service:Playlist:1',
            'DeleteAll',
            '',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Delete failed with status " + res.statusCode));
                }
            }
        );
    };
    this.queueTrack = function(trackDetailsXml, afterId, callback) {
        xmlParser.parseString(trackDetailsXml, function (err, result) {
            if (err) {
                callback(err);
            } else {
                var res = _.isObject(result['DIDL-Lite']['item']['res']) ? result['DIDL-Lite']['item']['res']._ : result['DIDL-Lite']['item']['res'];
                var trackUri = res
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
                    '<AfterId>' + afterId + '</AfterId><Uri>' + trackUri + '</Uri><Metadata>' + metadata + '</Metadata>',
                    function (res) {
                        if (res.statusCode === 200) {
                            callback();
                        } else {
                            callback(new Error("Queue failed with " + res.statusCode));
                        }
                    }
                );
            }
        });
    };
    this.changeSource = function (source, callback) {
        upnp.soapRequest(
            device,
            'Ds/Product/control',
            'urn:av-openhome.org:service:Product:1',
            'SetSourceIndex',
            '<Value>'+source+'</Value>',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Change Source failed with status " + res.statusCode));
                }
            }
        );
    };
    this.powerOn = function (callback) {
        upnp.soapRequest(
            device,
            'Ds/Product/control',
            'urn:av-openhome.org:service:Product:1',
            'SetStandby',
            '<Value>1</Value>',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Power On failed with status " + res.statusCode));
                }
            }
        );
    };
    this.playRadio = function (callback) {
        upnp.soapRequest(
            device,
            'Ds/Radio/control',
            'urn:av-openhome.org:service:Radio:1',
            'Play',
            '',
            function (res) {
                if (res.statusCode === 200) {
                    callback();
                } else {
                    callback(new Error("Power On failed with status " + res.statusCode));
                }
            }
        );
    };
};