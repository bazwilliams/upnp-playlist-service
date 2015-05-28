var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

describe('m3u', function () {
    var sut, fsFake, dirListing, configFake, playlistPath, fileData;
    beforeEach(function() {
        playlistPath = 'playlists';
        dirListing = [];
        fileData = {};
        fsFake = {
            readdir: sinon.spy(function(folderLocation, callback) { callback(null, dirListing ); }),
            readFile: sinon.spy(function(filename, options, callback) { callback(null, fileData.data ); })     
        };
        configFake = {
            config: function () {
                return { 
                    playlistPath: playlistPath
                };
            }
        };
        mockery.enable({
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
        beforeEach(function () {
            fileData.data = require('./data/playlistData.js').oneMetadata;
        });
        describe('Containing a single metadatum', function () {
            beforeEach(function (done) {
                sut.read('playlistName', function(err, data) {
                    expect(err).not.to.exist;
                    results = data;
                    done();
                });
            });
            // it('Should request the correct file', function () {
            //     var expectedFilename = require('path').join('playlists', 'playlistName.m3u');
            //     expect(fsFake.readFile).to.have.been.calledWith(expectedFilename);
            // });
            it('Should return an array of 1 item', function() {
                expect(results).to.be.an('array').and.have.length(1);
            });
            it('Should return the metadata entries', function () {
                expect(results[0]).to.be.eql('<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">American Monster</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://images.tidalhifi.com/im/im?w=250&amp;h=250&amp;albumid=43375078</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">American Monster</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Everclear</upnp:artist><res>tidal://track?version=1&amp;trackId=43375079</res></item></DIDL-Lite>');
            });
        });
    });
    describe('When writing playlists', function () {
        var results, tracks;
        beforeEach(function (done) {
            tracks = [];
            sut.write(tracks, 'playlistName', function(err, data) {
                expect(err).not.to.exist;
                results = data;
                done();
            });
        });
    });
    describe('When appending playlists', function () {
        var results, track;
        beforeEach(function (done) {
            track = {};
            sut.append(track, 'playlistName', function(err, data) {
                expect(err).not.to.exist;
                results = data;
                done();
            });
        });
    });
});