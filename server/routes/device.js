var manager = require('../devicemanager.js');
var scheduleManager = require('../schedulemanager.js');
var _ = require('underscore');
var zpad = require('zpad');
var async = require('async');

function responseHandler(res) {
    return function handler(err, results) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(results);
        }
    };
}
function toScheduleResource(schedule) {
    if (schedule) {
        var days = {
            'mon' : false,
            'tue' : false,
            'wed' : false,
            'thu' : false,
            'fri' : false,
            'sat' : false,
            'sun' : false
        };
        _.each(schedule.schedule.dayOfWeek, function (day) {
            var key = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day];
            days[key] = true;
        });
        return {
            days: days,
            time: zpad(schedule.schedule.hour) + ':' + zpad(schedule.schedule.minute),
            action: schedule.actions.setStandby ? 'sleep' : 'wake',
            playlistName: schedule.actions.playlistName,
            links: [{
                rel: 'delete',
                href: '/api/devices/'+schedule.uuid+'/schedules/'+schedule.id
            }]
        };
    }
}
function toDeviceResource(deviceModel, callback) {
    callback(null, {
        uuid: deviceModel.uuid,
        icon: deviceModel.device.icon,
        name: deviceModel.device.name,
        room: deviceModel.device.name.split(':')[0],
        schedules: _.map(deviceModel.schedules, toScheduleResource),
        links: [{
            rel: 'store-playlist',
            href: '/api/devices/' + deviceModel.uuid + '/playlist/'
        },{
            rel: 'add-to-playlist',
            href: '/api/devices/' + deviceModel.uuid + '/playlist/'
        },{
            rel: 'play-music',
            href: '/api/devices/' + deviceModel.uuid + '/play'
        },{
            rel: 'add-schedule',
            href: '/api/devices/' + deviceModel.uuid + '/schedules'
        },{
            rel: 'toggle-standby',
            href: '/api/devices/' + deviceModel.uuid + '/toggle-standby'
        },{
            rel: 'volume-up',
            href: '/api/devices/' + deviceModel.uuid + '/volume-up'
        },{
            rel: 'volume-down',
            href: '/api/devices/' + deviceModel.uuid + '/volume-down'
        }]
    });
}
function returnStandbyState(standbyState, callback) {
    return function powerResponseHandler(err, results) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, { standbyState: standbyState });
        }
    };
}
exports.volumeUp = function volumeUp(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        device.ds.volumeInc(responseHandler(res));
    } else {
        res.sendStatus(404);
    }
};
exports.volumeDown = function volumeDown(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        device.ds.volumeDec(responseHandler(res));
    } else {
        res.sendStatus(404);
    }
};
exports.toggleStandby = function toggleStandby(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        async.waterfall([
            device.ds.standbyState,
            function togglePowerState(currentStandbyState, iterCallback) {
                if (currentStandbyState === '1') {
                    device.ds.powerOn(returnStandbyState(0, iterCallback));
                } else {
                    device.ds.powerOff(returnStandbyState(1, iterCallback));
                }
            }
        ], responseHandler(res));
    } else {
        res.sendStatus(404);
    }
};
exports.list = function list(req, res) {
    async.waterfall([
        function getDevices(iterCallback) {
            iterCallback(null, manager.getDevices());
        },
        function getSchedules(uuids, iterCallback) {
            async.map(uuids, function getDeviceSchedule(uuid, jterCallback) {
                scheduleManager.list(uuid, function createDeviceModel(err, schedules) {
                    if (err) {
                        jterCallback(err);
                    } else {
                        jterCallback(null, {
                            uuid: uuid,
                            device: manager.getDevice(uuid),
                            schedules: schedules
                        });
                    }
                });
            }, iterCallback);
        },
        function toResource(results, iterCallback) {
            async.map(results, toDeviceResource, iterCallback);
        }
    ], responseHandler(res));
};