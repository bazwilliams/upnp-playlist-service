var manager = require('../devicemanager.js');
var scheduleManager = require('../schedulemanager.js');
var _ = require('underscore');
var zpad = require('zpad');
var async = require('async');

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
exports.toggleStandby = function toggleStandby(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        async.waterfall([
            device.ds.standbyState,
            function togglePowerState(currentStandbyState, iterCallback) {
                if (currentStandbyState === '1') {
                    device.ds.powerOn(iterCallback);
                } else {
                    device.ds.powerOff(iterCallback);
                }
            }
        ], function responseHandler(err, results) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.status(200).send(results);
            }
        });
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
            async.map(results, function toDeviceResource(deviceModel, jterCallback) {
                jterCallback(null, {
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
                    }]
                });
            }, iterCallback)
        }
    ], function (err, deviceResources) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).json(deviceResources);
        }
    });
};