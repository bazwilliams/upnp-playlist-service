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

describe('m3u', function () {
    var sut, fsFake, dirListing, configFake, playlistPath, musicRoot, fileData;
    beforeEach(function() {
        playlistPath = path.join('music', 'playlists');
        musicRoot = 'music';
        dirListing = [];
        fileData = {};
        fsFake = {
            readdir: sinon.spy(function(folderLocation, callback) { callback(null, dirListing ); }),
            readFile: sinon.spy(function(filename, options, callback) { callback(null, fileData.data ); }),
            stat: sinon.spy(function(filename, callback) { callback(null, fileData.stats); }),
            writeFile: sinon.spy(function(filename, data, options, callback) { callback(); }),
            appendFile: sinon.spy(function(filename, data, options, callback) { callback(); })
        };
        configFake = {
            config: function () {
                return { 
                    playlistPath: playlistPath,
                    musicRoot: musicRoot
                };
            }
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('./configmanager.js', configFake);
        mockery.registerMock('fs', fsFake);

        sut =  require('../server/m3u.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When listing playlists', function () {
        var results;
        beforeEach(function (done) {
            dirListing.push('monday.m3u');
            dirListing.push('tuesday.m3u');
            dirListing.push('wednesday.m3u');
            sut.list(function(err, data) {
                expect(err).not.to.exist;
                results = data;
                done();
            });
        });
        it('Should request files in configured playlist path', function () {
            expect(fsFake.readdir).to.have.been.calledWith(playlistPath);
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
                fileData.data = require('./data/playlistData.js').oneMetadata;
                sut.read('playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            it('Should request the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                expect(fsFake.readFile).to.have.been.calledWith(expectedFilename);
            });
            it('Should return an array of 1 item', function() {
                expect(results).to.be.an('array').and.have.length(1);
            });
            it('Should return the metadata entries', function () {
                expect(results[0]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>');
            });
        });
        describe('Containing a single metadatum and track', function () {
            beforeEach(function (done) {
                fileData.data = require('./data/playlistData.js').oneMetadataAndTrack;
                sut.read('playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            it('Should request the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                expect(fsFake.readFile).to.have.been.calledWith(expectedFilename);
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
                fileData.data = require('./data/playlistData.js').twoMetadata;
                sut.read('playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            it('Should request the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                expect(fsFake.readFile).to.have.been.calledWith(expectedFilename);
            });
            it('Should return an array of 2 items', function() {
                expect(results).to.be.an('array').and.have.length(2);
            });
            it('Should return the metadata entries', function () {
                expect(results[0]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>');
                expect(results[1]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Monterey</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43357726</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Monterey</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Milk Carton Kids</upnp:artist><res>tidal://track?version=1&amp;trackId=43357727</res></item></DIDL-Lite>');
            });
        });
        describe('Containing a multiple metadatum and tracks', function () {
            beforeEach(function (done) {
                fileData.data = require('./data/playlistData.js').twoMetadataAndTracks;
                sut.read('playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            it('Should request the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                expect(fsFake.readFile).to.have.been.calledWith(expectedFilename, { encoding: 'utf8' });
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
        describe('Where files do not exist locally', function () {
            var tracks;
            beforeEach(function (done) {
                tracks = [{
                    track: 'tidal://track?version=1&trackId=29512950',
                    metadata: '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>'
                }, {
                    track: 'tidal://track?version=1&trackId=34835954',
                    metadata: '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Gun</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=34835951</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Bones Of What You Believe (Special Edition)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">CHVRCHES</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=34835954</res></item></DIDL-Lite>'
                }, {
                    track: '/media/playlists/American Monster.flac',
                    metadata: '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>'
                }];
                sut.write(tracks, 'playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    done();
                });
            });
            it('Should write to the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                var expectedData = '#<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Pulsing (feat. Nina K)</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=29512948</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Love Me</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Tomas Barfod</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=29512950</res></item></DIDL-Lite>\n#<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Gun</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=34835951</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">The Bones Of What You Believe (Special Edition)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">CHVRCHES</upnp:artist><res protocolInfo="http-get:*:*:*">tidal://track?version=1&amp;trackId=34835954</res></item></DIDL-Lite>\n#<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>\n';
                expect(fsFake.writeFile).to.have.been.calledWith(expectedFilename, expectedData, { flag: 'w', encoding: 'utf8' });
            });
        });
        describe('Where files exist locally', function () {
            var tracks;
            beforeEach(function (done) {
                tracks = [{
                    track: path.join('music', 'Skeleton Tiger.flac'),
                    metadata: '<DIDL-Lite>Metadata</DIDL-Lite>'
                }];
                fileData.stats = {
                    isFile: function () { return true; }
                };
                sut.write(tracks, 'playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    done();
                });
            });
            it('Should write to the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                var relativeMusicPath = path.join('..', 'Skeleton Tiger.flac');
                var expectedData = relativeMusicPath + '\n#<DIDL-Lite>Metadata</DIDL-Lite>\n';
                expect(fsFake.writeFile).to.have.been.calledWith(expectedFilename, expectedData, { flag: 'w', encoding: 'utf8' });
            });
        });
    });
    describe('When appending playlists', function () {
        describe('Where file does not exist locally', function () {
            beforeEach(function (done) {
                var track = {
                    track: path.join('music', 'Skeleton Tiger.flac'),
                    metadata: '<DIDL-Lite>Metadata</DIDL-Lite>'
                };
                fileData.stats = {
                    isFile: function () { return false; }
                };
                sut.append(track, 'playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    done();
                });
            });
            it('Should write to the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                var expectedData = '#<DIDL-Lite>Metadata</DIDL-Lite>\n';
                expect(fsFake.appendFile).to.have.been.calledWith(expectedFilename, expectedData, { encoding: 'utf8' });
            });
        });
        describe('Where file exist locally', function () {
            beforeEach(function (done) {
                var track = {
                    track: path.join('music', 'Skeleton Tiger.flac'),
                    metadata: '<DIDL-Lite>Metadata</DIDL-Lite>'
                };
                fileData.stats = {
                    isFile: function () { return true; }
                };
                sut.append(track, 'playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    done();
                });
            });
            it('Should write to the correct file', function () {
                var expectedFilename = path.join('music', 'playlists', 'playlistName.m3u');
                var relativeMusicPath = path.join('..', 'Skeleton Tiger.flac');
                var expectedData = relativeMusicPath + '\n#<DIDL-Lite>Metadata</DIDL-Lite>\n';
                expect(fsFake.appendFile).to.have.been.calledWith(expectedFilename, expectedData, { encoding: 'utf8' });
            });
        });
    });
});