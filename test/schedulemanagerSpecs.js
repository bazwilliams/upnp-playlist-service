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

describe('Schedule Manager', function () {
    var sut, configFake, fakeStorage, fakeData, uuid;
    beforeEach(function() {
        uuid = '902d2bd6-5740-4658-9088-47974e00b585';
        fakeData = {
            data: void 0
        };
        fakeStorage = {
            initSync: sinon.spy(),
            getItem: sinon.spy(function (filename, callback) { callback(null, fakeData.data); }),
            setItem: sinon.spy(function (filename, data, callback) { callback(); })
        };
        configFake = {
            config: function () {
                return {
                    playlistPath: '',
                    musicRoot: ''
                };
            }
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('./configmanager.js', configFake);
        mockery.registerMock('node-persist', fakeStorage);

        sut = require('../server/schedulemanager.js');
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When listing schedules', function () {
        var results;
        beforeEach(function(done) {
            fakeData.data = [{
                id: '4dc81578-5172-46b6-8124-2129601075b5',
                uuid: '902d2bd6-5740-4658-9088-47974e00b585'
            },{
                id: '6dc81578-5172-46b6-8124-2129601075b5',
                uuid: 'a02d2bd6-5740-4658-9088-47974e00b585'
            }];
            sut.list(uuid, function(err, data) {
                expect(err).to.not.exist;
                results = data;
                done();
            });
        });
        it('Should request data from correct file', function () {
            expect(fakeStorage.getItem).to.have.been.calledWith('actions.json');
        });
        it('Should return an array of 1', function () {
            expect(results).to.be.an('array').and.have.length(1);
        });
        it('Should contain correct result', function () {
            expect(results[0].id).to.be.eql('4dc81578-5172-46b6-8124-2129601075b5');
        });
    });
    describe('When adding a schedule', function () {
        var results;
        beforeEach(function(done) {
            fakeData.data = [{
                id: '4dc81578-5172-46b6-8124-2129601075b5',
                uuid: uuid
            },{
                id: '6dc81578-5172-46b6-8124-2129601075b5',
                uuid: 'a02d2bd6-5740-4658-9088-47974e00b585'
            }];
            var schedule = {
                dayOfWeek: [0, 1, 2, 3, 4],
                hour: 3,
                minute: 14,
                sourceId: 1,
                playlistName: 'cool',
                isStandby: false,
                radioChannel: null
            };
            sut.addSchedule(uuid, schedule, function(err, data) {
                expect(err).to.not.exist;
                results = data;
                done();
            });
        });
        it('Should request data from correct file', function () {
            expect(fakeStorage.getItem).to.have.been.calledWith('actions.json');
        });
        it('Should store data in correct file', function () {
            expect(fakeStorage.setItem).to.have.been.calledWith('actions.json');
        });
        it('Should add schedule to existing file', function () {
            expect(fakeStorage.setItem.args[0][1]).to.be.an('array').and.have.length(3);
            expect(fakeStorage.setItem.args[0][1][0]).to.be.eql({
                id: '4dc81578-5172-46b6-8124-2129601075b5',
                uuid: uuid
            });
            expect(fakeStorage.setItem.args[0][1][1]).to.be.eql({
                id: '6dc81578-5172-46b6-8124-2129601075b5',
                uuid: 'a02d2bd6-5740-4658-9088-47974e00b585'
            });
            expect(fakeStorage.setItem.args[0][1][2]).to.include.keys('uuid', 'actions', 'schedule');
            expect(fakeStorage.setItem.args[0][1][2].uuid).to.be.eql(uuid);
            expect(fakeStorage.setItem.args[0][1][2].actions).to.be.eql({ playlistName: "cool", radioChannel: null, setStandby: false, sourceId: 1 });
            expect(fakeStorage.setItem.args[0][1][2].schedule).to.be.eql({ dayOfWeek: [0, 1, 2, 3, 4], hour: 3, minute: 14 });
        });
        it('Should reschedule everything', function () {
           //TODO: add a test which ensures schedulemanager.scheduleJobs() is invoked by mocking out node-schedule
        });
    });
    describe('When deleting a schedule', function () {
        beforeEach(function(done) {
            sut.deleteSchedule(done);
        });
    });
});