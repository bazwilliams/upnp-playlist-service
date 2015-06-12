"use strict";
/* jshint -W024 */
/* jshint -W079 */
/* jshint expr:true */

var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var path = require('path');

describe('playlists', function () {
    var sut, playlistName, dsFake, fakeData, m3uFake, playlistPath, musicRoot;
    beforeEach(function() {
        playlistName = 'testPlaylist';
        playlistPath = path.join('music', 'playlists');
        musicRoot = 'music';
        fakeData = {
            currentTrack: void 0,
            tracks: []
        };
        dsFake = {
            currentTrackDetails: function (callback) { callback(null, fakeData.currentTrack); },
            deleteAll: sinon.spy(function (callback) { callback(); }),
            queueTrack: sinon.spy(function (trackXml, afterId, callback) { callback(); })
        };
        m3uFake = {
            read: function (playlistName, callback) { callback(null, fakeData.tracks ); },
            write: function (tracks, playlistName, callback) { callback(); },
            append: sinon.spy(function (track, playlistName, callback) { callback(null, track.metadata); })
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('./m3u.js', m3uFake);

        sut = require('../server/playlists.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When appending a track to existing playlist', function () {
        var result, track;
        beforeEach(function (done) {
            track = {
                track: path.join('music', 'Skeleton Tiger.flac'),
                metadata: '<DIDL-Lite><item><upnp:artist>Artist</upnp:artist><dc:title>Title</dc:title><upnp:albumArtURI>AlbumURI</upnp:albumArtURI><upnp:album>Album</upnp:album></item></DIDL-Lite>'
            };
            fakeData.currentTrack = track;
            sut.appendCurrentTrack(dsFake, playlistName, function(err, data) {
                expect(err).to.not.exist;
                result = data;
                done();
            });
        });
        it('Should append track details from the ds to the named playlist', function () {
            expect(m3uFake.append).to.have.been.calledWith(track);
        });
        it('Should return information about the track', function () {
            expect(result).to.be.eql({
                artist: 'Artist',
                title: 'Title',
                albumArt: 'AlbumURI',
                album: 'Album'
            });
        });
    });
    describe('When loading a playlist', function () {
        var result;
        beforeEach(function (done) {
            fakeData.tracks = [
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>',
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Gun</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=34835951</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Bones Of What You Believe (Special Edition)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">CHVRCHES</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=34835954</res></item></DIDL-Lite>',
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>'
            ];
            sut.replacePlaylist(dsFake, playlistName, function(err, data) {
                expect(err).to.not.exist;
                result = data;
                done();
            });
        });
        it('Should delete all tracks on DS', function() {
            expect(dsFake.deleteAll).to.have.been.called;
        });
        it('Should queue tracks in correct order', function () {
            expect(dsFake.queueTrack.args[0][0]).to.be.eql(fakeData.tracks[2]);
            expect(dsFake.queueTrack.args[0][1]).to.be.eql(0);
            expect(dsFake.queueTrack.args[1][0]).to.be.eql(fakeData.tracks[1]);
            expect(dsFake.queueTrack.args[1][1]).to.be.eql(0);
            expect(dsFake.queueTrack.args[2][0]).to.be.eql(fakeData.tracks[0]);
            expect(dsFake.queueTrack.args[2][1]).to.be.eql(0);
        });
    });
    describe('When saving a playlist', function () {
        var result;
        beforeEach(function (done) {
            sut.savePlaylist(dsFake, playlistName, function(err, data) {
                expect(err).to.not.exist;
                result = data;
                done();
            });
        });
    });
});