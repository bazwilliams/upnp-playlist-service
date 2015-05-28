var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

describe('m3u', function () {
    var sut;
    beforeEach(function() {
        sut =  require('../server/m3u.js');
    });
    describe('When listing playlists', function () {
        var results;
        beforeEach(function (done) {
            sut.list(function(err, data) {
                expect(err).not.to.exist;
                results = data;
                done();
            });
        });
    });
    describe('When reading playlists', function () {
        var results;
        beforeEach(function (done) {
            sut.read('playlistName', function(err, data) {
                expect(err).not.to.exist;
                results = data;
                done();
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