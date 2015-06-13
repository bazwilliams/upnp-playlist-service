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

describe('configmanager', function () {
    var sut, persistFake;
    beforeEach(function () {
        persistFake = {
            getItemSync: sinon.stub(),
            setItem: sinon.spy(function (filename, data, callback) { callback(); }),
            initSync: sinon.spy()
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('node-persist', persistFake);

        sut = require('../server/configmanager.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When getting configuration for first time', function () {
        var result, initialConfig;
        beforeEach(function () {
            initialConfig = {};
            persistFake.getItemSync.onCall(0).returns(initialConfig);
            result = sut.config();
        });
        it('Should request from storage', function () {
            expect(persistFake.getItemSync).to.have.been.calledWith('configuration.json');
        });
        describe('and then getting configuration for second time', function () {
            beforeEach(function () {
                persistFake.getItemSync.reset();
                result = sut.config();
            });
            it('Should not request from storage', function () {
                expect(persistFake.getItemSync).not.to.have.been.called;
            });
            it('Should return cached configuration', function () {
                expect(result).to.be.eql(initialConfig);
            });
        });
        describe('and then storing a configuration', function () {
            var expectedConfiguration;
            beforeEach(function (done) {
                expectedConfiguration = {
                    musicRoot: '/music',
                    playlistPath: '/music/playlists'
                };
                sut.storeConfiguration(expectedConfiguration, done);
            });
            it('Should send configuration to storage', function () {
                expect(persistFake.setItem).to.have.been.calledWith('configuration.json', expectedConfiguration);
            });
            describe('and then requesting the configuration', function () {
                beforeEach(function () {
                    persistFake.getItemSync.reset();
                    result = sut.config();
                });
                it('Should not request from storage', function () {
                    expect(persistFake.getItemSync).not.to.have.been.called;
                });
                it('Should return the cached configuration', function () {
                    expect(result).to.be.eql(expectedConfiguration);
                });
            });
        });
    });
});