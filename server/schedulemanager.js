var storage = require('node-persist');
var scheduler = require('node-schedule');
var _ = require('underscore');
var guid = require('node-uuid');
var Ds = require('./ds.js').Ds;
var async = require('async');

storage.initSync();

function recurrenceRuleFactory(schedule) {
    var recurrence = new scheduler.RecurrenceRule();
    recurrence.dayOfWeek = schedule.dayOfWeek;
    recurrence.hour = schedule.hour;
    recurrence.minute = schedule.minute;
    return recurrence;
}

exports.ScheduleManager = function(options) {
    var jobs = [];
    function actionFactory(uuid, sourceId, callback) {
        return function () {
            var device = options.manager.getDevice(uuid);
            if (device) {
                var ds = new Ds(device);
                async.series([
                    ds.powerOn,
                    function(iterCallback) {
                        ds.changeSource(sourceId, iterCallback);
                    },
                    ds.playRadio
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
        jobs = _.map(storage.getItem('schedules.json'), function (schedule) {
            return scheduler.scheduleJob(recurrenceRuleFactory(schedule.wakeUp), actionFactory(schedule.uuid, schedule.source, callback));
        });
    }
    this.wakeUpSchedulesFor = function (uuid) {
        return _.chain(storage.getItem('schedules.json'))
            .filter(function(schedule) {
                return schedule.uuid === uuid;
            })
            .value();
    };
    this.addWakeUpScheduleFor = function (uuid, schedule, callback) {
        if (schedule.dayOfWeek.length > 0) {
            var schedules = storage.getItem('schedules.json');
            var wakeUp = {
                id: guid.v1(),
                uuid: uuid,
                source: 1, //defaults to DS radio
                wakeUp: schedule
            };
            schedules.push(wakeUp);
            storage.setItem('schedules.json', schedules);
            scheduleJobs();
            callback(null, wakeUp);
        } else {
            callback(new Error("No days of week set"));
        }
    };
    this.deleteWakeUpSchedule = function (uuid, id, callback) {
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
    if (!storage.getItem('schedules.json')) {
        storage.setItem('schedules.json', []);
    }
    scheduleJobs();
};