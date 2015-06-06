"use strict";

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

var path = require('path');

describe('trackprocessor', function () {
    var sut, configFake, musicRoot;
    beforeEach(function () {
        musicRoot = 'music';
        configFake = {
            config: function () {
                return {
                    musicRoot: musicRoot
                };
            }
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('./configmanager.js', configFake);

        sut = require('../server/trackprocessor.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When submitting minimserver URI', function () {
        var result;
        beforeEach(function () {
            result = sut.translate('http://192.168.1.126:9790/minimserver/*/music/Albums/Public*20Service*20Broadcasting/The*20Race*20for*20Space/01-03-Public_Service_Broadcasting-Gagarin-SMR.flac');
        });
        it('It should return an absolute filepath', function () {
            var expectedFilePath = path.join(musicRoot,'Albums','Public Service Broadcasting','The Race for Space','01-03-Public_Service_Broadcasting-Gagarin-SMR.flac');
            expect(result).to.be.eql(expectedFilePath);
        });
    });
    describe('When submitting alternative http URI', function () {
        var result;
        beforeEach(function () {
            result = sut.translate('http://192.168.1.126:9790/kazooserver/*/music/Albums/Public*20Service*20Broadcasting/The*20Race*20for*20Space/01-03-Public_Service_Broadcasting-Gagarin-SMR.flac');
        });
        it('It should return original URI', function () {
            expect(result).to.be.eql('http://192.168.1.126:9790/kazooserver/*/music/Albums/Public*20Service*20Broadcasting/The*20Race*20for*20Space/01-03-Public_Service_Broadcasting-Gagarin-SMR.flac');
        });
    });
    describe('When submitting alternative URI', function () {
        var result;
        beforeEach(function () {
            result = sut.translate('tidal://tracks?id=1234');
        });
        it('It should return original URI', function () {
            expect(result).to.be.eql('tidal://tracks?id=1234');
        });
    });
});