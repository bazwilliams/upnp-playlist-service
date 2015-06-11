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
            currentTrack: void 0
        };
        dsFake = {
            currentTrackDetails: function (callback) {
                callback(null, fakeData.currentTrack);
            }
        };
        m3uFake = {
            read: function (playlistName, callback) { callback(); },
            write: function (tracks, playlistName, callback) { callback(); },
            append: sinon.spy(function (track, playlistName, callback) { callback(null, track.metadata); })
        }
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
            sut.replacePlaylist(dsFake, playlistName, function(err, data) {
                expect(err).to.not.exist;
                result = data;
                done();
            });
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