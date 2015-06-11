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

describe('recipes', function () {
    var sut, playlistFake, trackIds;
    beforeEach(function () {
        trackIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        playlistFake = {
            replacePlaylist: sinon.spy(function(ds, playlistName, callback) { callback(null, trackIds); })
        };
        mockery.enable({
            warnOnUnregistered: false
        });
        mockery.registerMock('./playlists.js', playlistFake);
        sut = require('../server/recipes.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When increasing volume', function () {
        var dsFake;
        beforeEach(function (done) {
            var volumeInc = sinon.spy(function(callback) { callback(); });
            dsFake = {
                volumeInc: volumeInc
            };
            sut.volumeUp(dsFake, 5, done);
        });
        it('Should call DS volume inc 5 times', function () {
            expect(dsFake.volumeInc).to.have.callCount(5);
        });
    });
    describe('When decreasing volume', function () {
        var dsFake;
        beforeEach(function (done) {
            var volumeDec = sinon.spy(function(callback) { callback(); });
            dsFake = {
                volumeDec: volumeDec
            };
            sut.volumeDown(dsFake, 5, done);
        });
        it('Should call DS volume dec 5 times', function () {
            expect(dsFake.volumeDec).to.have.callCount(5);
        });
    });
    describe('When toggling sleep', function () {
        var dsFake;
        beforeEach(function () {
            var powerOn = sinon.spy(function(callback) { callback(); });
            var powerOff = sinon.spy(function(callback) { callback(); });
            dsFake = {
                powerOn: powerOn,
                powerOff: powerOff
            };
        });
        describe('When DS is currently on', function () {
            var result;
            beforeEach(function (done) {
                dsFake.standbyState = function (callback) { callback(null, '0'); };
                sut.toggleStandby(dsFake, function(err, data) {
                    expect(err).not.to.exist;
                    result = data;
                    done();
                });
            });
            it('Should call powerOff', function () {
                expect(dsFake.powerOff).to.have.been.called;
            });
            it('Should not call powerOn', function () {
                expect(dsFake.powerOn).not.to.have.been.called;
            });
            it('Should return new standby state', function () {
                expect(result).to.be.eql({ standbyState: 1 });
            });
        });
        describe('When DS is currently off', function () {
            var result;
            beforeEach(function (done) {
                dsFake.standbyState = function (callback) { callback(null, '1'); };
                sut.toggleStandby(dsFake, function(err, data) {
                    expect(err).not.to.exist;
                    result = data;
                    done();
                });
            });
            it('Should not call powerOff', function () {
                expect(dsFake.powerOff).not.to.have.been.called;
            });
            it('Should call powerOn', function () {
                expect(dsFake.powerOn).to.have.been.called;
            });
            it('Should return new standby state', function () {
                expect(result).to.be.eql({ standbyState: 0 });
            });
        });
    });
    describe('When playing', function () {
        var dsFake;
        beforeEach(function() {
            dsFake = {
                powerOn: sinon.spy(function(callback) { callback(); }),
                changeSource: sinon.spy(function(sourceId, callback) { callback(); }),
                setRadioChannel: sinon.spy(function(radioChannel, callback) { callback(); }),
                playRadio: sinon.spy(function(callback) { callback(); }),
                enableShuffle: sinon.spy(function(callback) { callback(); }),
                disableShuffle: sinon.spy(function(callback) { callback(); }),
                playFromPlaylistIndex: sinon.spy(function(index, callback) { callback(); })
            };
        });
        describe('using a ds which is currently off', function () {
            beforeEach(function() {
                dsFake.standbyState = function (callback) { callback(null, '1'); };
            });
            describe('a playlist', function () {
                var playlistName;
                beforeEach(function () {
                    playlistName = 'TestPlaylist';
                });
                describe('in shuffle mode', function () {
                    beforeEach(function (done) {
                        Math.random = function () { return 1; };
                        sut.play(dsFake, 0, playlistName, true, null, done);
                    });
                    it('Should power the ds on', function () {
                        expect(dsFake.powerOn).to.have.been.called;
                    });
                    it('Should change the source to id 0', function () {
                        expect(dsFake.changeSource).to.have.been.calledWith(0);
                    });
                    // it('Should replace the playlist', function () {
                    //     expect(playlistFake.replacePlaylist).to.have.been.called;
                    // });
                    it('Should enable shuffle mode', function () {
                        expect(dsFake.enableShuffle).to.have.been.called;
                    });
                    it('Should start playback', function () {
                        expect(dsFake.playFromPlaylistIndex).to.have.been.calledWith(trackIds.length + 1);
                    });
                    it('Should not play the radio', function () {
                        expect(dsFake.playRadio).not.to.have.been.called;
                    });
                });
                describe('In normal mode', function () {
                    beforeEach(function (done) {
                        sut.play(dsFake, 0, playlistName, false, null, done);
                    });
                    it('Should power the ds on', function () {
                        expect(dsFake.powerOn).to.have.been.called;
                    });
                    it('Should change the source to id 0', function () {
                        expect(dsFake.changeSource).to.have.been.calledWith(0);
                    });
                    // it('Should replace the playlist', function () {
                    //     expect(playlistFake.replacePlaylist).to.have.been.called;
                    // });
                    it('Should disable shuffle mode', function () {
                        expect(dsFake.disableShuffle).to.have.been.called;
                    });
                    it('Should start playback from the beginning', function () {
                        expect(dsFake.playFromPlaylistIndex).to.have.been.calledWith(0);
                    });
                    it('Should not play the radio', function () {
                        expect(dsFake.playRadio).not.to.have.been.called;
                    });
                });
            });
            describe('a radio channel', function () {
                var radioChannel;
                beforeEach(function (done) {
                    radioChannel = {
                        id: 23,
                        uri: 'http://opml.radiotime.com/Tune.ashx?id=s44491&formats=mp3,wma,aac,wmvideo,ogg,hls&partnerId=ah2rjr68&username=bazwilliams&c=ebrowse',
                        title: 'BBC Radio 6 Music (AAA)',
                        artwork: 'http://cdn-radiotime-logos.tunein.com/s44491g.png'
                    };
                    sut.play(dsFake, 1, null, false, radioChannel, done);
                });
                it('Should power the ds on', function () {
                    expect(dsFake.powerOn).to.have.been.called;
                });
                it('Should change the source to id 1', function () {
                    expect(dsFake.changeSource).to.have.been.calledWith(1);
                });
                it('Should set the radio channel', function () {
                    expect(dsFake.setRadioChannel).to.have.been.calledWith(radioChannel);
                });
                it('Should play the radio', function () {
                    expect(dsFake.playRadio).to.have.been.called;
                });
                it('Should not start playlist playback', function () {
                    expect(dsFake.playFromPlaylistIndex).not.to.have.been.called;
                });
            });
            describe('a specific source', function () {
                beforeEach(function (done) {
                    sut.play(dsFake, 7, null, false, null, done);
                });
                it('Should power the ds on', function () {
                    expect(dsFake.powerOn).to.have.been.called;
                });
                it('Should change the source to id 7', function () {
                    expect(dsFake.changeSource).to.have.been.calledWith(7);
                });
                it('Should not play the radio', function () {
                    expect(dsFake.playRadio).not.to.have.been.called;
                });
                it('Should not start playlist playback', function () {
                    expect(dsFake.playFromPlaylistIndex).not.to.have.been.called;
                });
            });
        });
        describe('using a ds which is already on', function () {
            beforeEach(function(done) {
                dsFake.standbyState = function (callback) { callback(null, '0'); };
                sut.play(dsFake, 7, null, false, null, done);
            });
            it('Should not power the ds on', function () {
                expect(dsFake.powerOn).not.to.have.been.called;
            });
            it('Should change the source to id 7', function () {
                expect(dsFake.changeSource).to.have.been.calledWith(7);
            });
            it('Should not play the radio', function () {
                expect(dsFake.playRadio).not.to.have.been.called;
            });
            it('Should not start playlist playback', function () {
                expect(dsFake.playFromPlaylistIndex).not.to.have.been.called;
            });
        });
    });
    describe('When listing radio stations', function () {
        var dsFake, result, fakeRadioData, radioIdArray;
        beforeEach(function (done) {
            fakeRadioData = { uri: '/test' };
            radioIdArray = [1, 2, 3];
            dsFake = {
                getRadioIdArray: sinon.spy(function (callback) { callback(null, radioIdArray); }),
                retrieveRadioStationDetails: sinon.spy(function(idArray, callback) { callback(null, fakeRadioData); })
            };
            sut.listRadioStations(dsFake, function(err, data) {
                expect(err).not.to.exist;
                result = data;
                done();
            });
        });
        it('Should retrieve radio station idArray', function () {
            expect(dsFake.getRadioIdArray).to.have.been.called;
        });
        it('Should retrieve radio station details using the idArray', function () {
            expect(dsFake.retrieveRadioStationDetails).to.have.been.calledWith(radioIdArray);
        });
        it('Should return the radio station details', function () {
            expect(result).to.be.eql(fakeRadioData);
        });
    });
});