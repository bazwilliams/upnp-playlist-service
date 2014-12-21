var manager = require('../devicemanager.js');
var scheduleManager = require('../schedulemanager.js');
var _ = require('underscore');
var zpad = require('zpad');

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
    var devices = _.map(manager.getDevices(), function deviceToResource(uuid) {
        var device = manager.getDevice(uuid);
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: _.map(scheduleManager.wakeUpSchedulesFor(uuid), convertFromSchedule),
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
        };
    });
    res.json(devices);
};