var storage = require('./lib/node-persist.js');
var scheduler = require('node-schedule');
var _ = require('underscore');
var guid = require('node-uuid');
var async = require('async');
var devices = require('./devicemanager.js');

var jobs = [];

function recurrenceRuleFactory(schedule) {
    var recurrence = new scheduler.RecurrenceRule();
    recurrence.dayOfWeek = schedule.dayOfWeek;
    recurrence.hour = schedule.hour;
    recurrence.minute = schedule.minute;
    return recurrence;
}

function actionFactory(uuid, sourceId, callback) {
    return function () {
        var device = devices.getDevice(uuid);
        if (device) {
            async.series([
                device.ds.powerOn,
                function(iterCallback) {
                    device.ds.changeSource(sourceId, iterCallback);
                },
                device.ds.playRadio
            ], callback);
        } else {
            callback(new Error("Device with UUID (" + uuid + ") not found"));
        }
    };
}

function scheduleJobs() {
    function callback(err) {
        if (err) {
            console.log(err);
        }
    }
    _.each(jobs, function (job) {
        job.cancel();
    });
    storage.getItem('schedules.json', function loadPersistedJobs(err, schedules) {
        if (err) {
            callback(err);
        } else {
            jobs = _.map(schedules, function (schedule) {
                return scheduler.scheduleJob(recurrenceRuleFactory(schedule.wakeUp), actionFactory(schedule.uuid, schedule.source, callback));
            });
        }
    });
}

exports.wakeUpSchedules = function wakeUpSchedules(uuid, callback) {
    storage.getItem('schedules.json', function loadPersistedJobs(err, schedules) {
        if (err) {
            callback(err);
        } else {
            callback(null, _.where(schedules, { uuid: uuid }));
        }
    });
};

exports.addWakeUpSchedule = function addWakeUpSchedule(uuid, schedule, callback) {
    if (schedule.dayOfWeek.length > 0) {
        var schedules = storage.getItem('schedules.json');
        var wakeUp = {
            id: guid.v1(),
            uuid: uuid,
            source: 1, //defaults to DS radio
            wakeUp: schedule
        };
        schedules.push(wakeUp);
        storage.setItem('schedules.json', schedules, function saveNewJob(err) {
            if (err) {
                callback(err);
            } else {
                scheduleJobs();
                callback(null, wakeUp);
            }
        });
    } else {
        callback(new Error("No days of week set"));
    }
};

exports.deleteWakeUpSchedule = function deleteWakeUpSchedule(uuid, id, callback) {
    var schedules = storage.getItem('schedules.json');
    var newSchedules = _.reject(schedules, function (wakeUpSchedule) {
        return wakeUpSchedule.uuid === uuid && wakeUpSchedule.id == id;
    });
    if (newSchedules.length < schedules.length) {
        storage.setItem('schedules.json', newSchedules);
        scheduleJobs();
        callback();
    } else {
        callback(new Error("No schedule found"));
    }
};

storage.initSync();

if (!storage.getItem('schedules.json')) {
    storage.setItem('schedules.json', []);
}
scheduleJobs();