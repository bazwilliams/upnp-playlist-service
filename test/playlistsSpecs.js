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

let _ = require('underscore');

var path = require('path');

describe('playlists', function () {
    var sut, playlistName, dsFake, fakeData, m3uFake, playlistPath, musicRoot;
    beforeEach(function() {
        playlistName = 'testPlaylist';
        playlistPath = path.join('music', 'playlists');
        musicRoot = 'music';
        fakeData = {
            currentTrack: void 0,
            tracks: [],
            trackIds: [],
            error: null
        };
        dsFake = {
            currentTrackDetails: function (callback) { callback(null, fakeData.currentTrack); },
            deleteAll: sinon.spy(function (callback) { callback(); }),
            queueTrack: sinon.spy(function (trackXml, afterId, callback) { callback(); }),
            getTrackIds: sinon.spy(function (callback) { callback(null, fakeData.trackIds); }),
            retrieveTrackDetails: sinon.spy(function (trackIds, callback) { callback(null, fakeData.tracks); })
        };
        m3uFake = {
            read: function (playlistName, callback) { callback(fakeData.error, fakeData.tracks ); },
            write: sinon.spy(function (tracks, playlistName, callback) { callback(); }),
            append: sinon.spy(function (track, playlistName, callback) { callback(null, track); })
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('./playliststore.js', m3uFake);

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
            expect(m3uFake.append).to.have.been.calledWith(track.metadata);
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
    describe('When loading playlist with 1 item', function () {
        var result, error;
        beforeEach(function (done) {
            fakeData.tracks = '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>';
            sut.replacePlaylist(dsFake, playlistName, function(err, data) {
                error = err;
                done();
            });
        });
        it('Should return an error', function() {
            expect(error).to.exist;
        });
    });
    describe('When loading a playlist, but no data returned', function() {
        beforeEach(function (done) {
            fakeData.tracks = null;
            sut.replacePlaylist(dsFake, playlistName, function(err, data) {
                done();
            });
        });
        it('Should do nothing', function() {
            expect(dsFake.deleteAll).not.to.have.been.called;
            expect(dsFake.queueTrack).not.to.have.been.called;
        });
    });
    describe('When loading a playlist and an error is thrown', function() {
        beforeEach(function (done) {
            fakeData.error = new Error('Error');
            sut.replacePlaylist(dsFake, playlistName, function(err, data) {
                done();
            });
        });
        it('Should do nothing', function() {
            expect(dsFake.deleteAll).not.to.have.been.called;
            expect(dsFake.queueTrack).not.to.have.been.called;
        });
    });
        describe('When retrieving a playlist', function () {
        var result;
        beforeEach(function (done) {
            fakeData.tracks = [
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>',
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Gun</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=34835951</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Bones Of What You Believe (Special Edition)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">CHVRCHES</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=34835954</res></item></DIDL-Lite>',
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>'
            ];
            sut.getPlaylist(playlistName, function(err, data) {
                expect(err).to.not.exist;
                result = data;
                done();
            });
        });
        it('Should return 3 tracks', () => {
            expect(result).to.have.length(3);
        });
        it('Should return information about the track', function () {
            expect(result[0]).to.be.eql({
                artist: 'Tomas Barfod',
                title: 'Pulsing (feat. Nina K)',
                albumArt: 'http://images.tidalhifi.com/im/im?w=250&h=250&albumid=29512948',
                album: 'Love Me'
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
            fakeData.trackIds = [ 11, 4, 14 ];
            fakeData.tracks = [{
                track: 'tidal://track?version=1&trackId=29512950',
                metadata: '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>'
            }, {
                track: 'tidal://track?version=1&trackId=34835954',
                metadata: '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Gun</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=34835951</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Bones Of What You Believe (Special Edition)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">CHVRCHES</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=34835954</res></item></DIDL-Lite>'
            }, {
                track: '/media/playlists/American Monster.flac',
                metadata: '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>'
            }];
            sut.savePlaylist(dsFake, playlistName, function(err, data) {
                expect(err).to.not.exist;
                result = data;
                done();
            });
        });
        it('Should request tracks from ds', function () {
            expect(dsFake.getTrackIds).to.have.been.called;
        });
        it('Should request track details from ds', function () {
            expect(dsFake.retrieveTrackDetails).to.have.been.calledWith(fakeData.trackIds);
        });
        it('Should then store the tracks', function () {
            expect(m3uFake.write).to.have.been.calledWith(_.pluck(fakeData.tracks, 'metadata'), playlistName);
        });
    });
});