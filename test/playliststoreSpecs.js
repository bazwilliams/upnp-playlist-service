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

describe('Playlist Store', function () {
    var sut, persistFake, fakeData;
    beforeEach(function () {
        fakeData = { data: void 0 };
        persistFake = {
            getItem: sinon.spy(function (key, callback) { callback(null, fakeData.data); }),
            setItem: sinon.spy(function (filename, data, callback) { callback(); }),
            initSync: sinon.spy(),
            valuesWithKeyMatch : sinon.stub()
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('node-persist', persistFake);

        sut =  require('../server/playliststore.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When listing playlists', function () {
        var results, expectedPlaylists;
        beforeEach(function (done) {
            expectedPlaylists = [
                { name: 'monday' },
                { name: 'tuesday' },
                { name: 'wednesday' }];

            persistFake.valuesWithKeyMatch.withArgs(/\/playlists\/.*/).returns(expectedPlaylists);

            sut.list(function(err, data) {
                expect(err).not.to.exist;
                results = data;
                done();
            });
        });
        it('Should return 3 playlist items as an array', function () {
            expect(results).to.be.an('array').and.have.length(3);
        });
        it('Should return playlist names', function () {
            expect(results).to.have.members(['monday', 'tuesday', 'wednesday']);
        });
    });
    describe('When reading playlists', function () {
        var results;
        describe('Containing a single metadatum', function () {
            beforeEach(function (done) {
                fakeData.data = {
                    name: 'playlistName0',
                    tracks: require('./data/playlistData.js').oneMetadata
                };
                sut.read('playlistName0', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            it('Should request the correct item', function () {
                expect(persistFake.getItem).to.have.been.calledWith('/playlists/playlistName0');
            });
            it('Should return an array of 1 item', function() {
                expect(results).to.be.an('array').and.have.length(1);
            });
            it('Should return the metadata entries', function () {
                expect(results[0]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>');
            });
        });
        describe('Containing a multiple metadatum', function () {
            beforeEach(function (done) {
                fakeData.data = {
                    name: 'playlistName2',
                    tracks: require('./data/playlistData.js').twoMetadata
                };
                sut.read('playlistName2', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            it('Should request the correct file', function () {
                expect(persistFake.getItem).to.have.been.calledWith('/playlists/playlistName2');
            });
            it('Should return an array of 2 items', function() {
                expect(results).to.be.an('array').and.have.length(2);
            });
            it('Should return the metadata entries', function () {
                expect(results[0]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>');
                expect(results[1]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Monterey</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43357726</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Monterey</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Milk Carton Kids</upnp:artist><res>tidal://track?version=1&amp;trackId=43357727</res></item></DIDL-Lite>');
            });
        });
    });
    describe('When writing playlists', function () {
        var tracks;
        beforeEach(function (done) {
            tracks = [
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>',
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Gun</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=34835951</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Bones Of What You Believe (Special Edition)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">CHVRCHES</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=34835954</res></item></DIDL-Lite>',
                '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>'
            ];
            sut.write(tracks, 'playlistName0', function (err, data) {
                expect(err).not.to.exist;
                done();
            });
        });
        it('Should write to the correct item', function () {
            var expectedData = {
                name: 'playlistName0',
                tracks: tracks
            };
            expect(persistFake.setItem).to.have.been.calledWith('/playlists/playlistName0', expectedData);
        });
    });
    describe('When appending playlists', function () {
        beforeEach(function (done) {
            fakeData.data = {
                name: 'existingPlaylist',
                tracks: require('./data/playlistData.js').oneMetadata
            };
            var track = '<DIDL-Lite>Metadata</DIDL-Lite>';
            sut.append(track, 'existingPlaylist', function (err, data) {
                expect(err).not.to.exist;
                done();
            });
        });
        it('Should load existing playlist', function () {
            expect(persistFake.getItem).to.have.been.calledWith('/playlists/existingPlaylist');
        });
        it('Should write to the correct item', function () {
            var expectedData = {
                name: 'existingPlaylist',
                tracks: ['<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>','<DIDL-Lite>Metadata</DIDL-Lite>']
            };
            expect(persistFake.setItem).to.have.been.calledWith('/playlists/existingPlaylist', expectedData);
        });
    });
});