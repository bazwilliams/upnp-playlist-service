var manager = require('../devicemanager.js');
var scheduleManager = require('../schedulemanager.js');
var _ = require('underscore');
var zpad = require('zpad');
var async = require('async');

function convertFromSchedule(schedule) {
    var days = {
        'mon' : false,
        'tue' : false,
        'wed' : false,
        'thu' : false,
        'fri' : false,
        'sat' : false,
        'sun' : false
    };
    _.each(schedule.wakeUp.dayOfWeek, function (day) {
        var key = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day];
        days[key] = true;
    });
    return {
        days: days,
        time: zpad(schedule.wakeUp.hour) + ':' + zpad(schedule.wakeUp.minute),
        links: [{
            rel: 'delete',
            href: '/api/devices/'+schedule.uuid+'/wake-up/'+schedule.id
        }]
    };
}
exports.list = function list(req, res) {
    async.waterfall([
        function getDevices(iterCallback) {
            iterCallback(null, manager.getDevices());
        },
        function getSchedules(iterCallback, devices) {
            async.map(devices, function getDeviceSchedule(device, jterCallback) {
                scheduleManager.wakeUpSchedules(device.uuid, function(err, schedules) {
                    if (err) {
                        jterCallback(err);
                    } else {
                        jterCallback(null, {
                            device: device,
                            schedules: schedules
                        });
                    }
                });
            }, iterCallback);
        },
        function toResource(iterCallback, results) {
            iterCallback(null, {
                uuid: uuid,
                icon: results.device.icon,
                name: results.device.name,
                schedules: convertFromSchedule(results.schedule),
                links: [{
                    rel: 'store-playlist',
                    href: '/api/devices/' + uuid + '/playlist/'
                },{
                    rel: 'replace-playlist',
                    href: '/api/devices/' + uuid + '/playlist/replace'
                },{
                    rel: 'add-wakeup',
                    href: '/api/devices/' + uuid + '/wake-up'
                }]
            });
        }
    ], function (err, results) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).json(devices);
        }
    });
};