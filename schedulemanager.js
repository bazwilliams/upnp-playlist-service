
var storage = require('node-persist');
var scheduler = require('node-schedule');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var guid = require('node-uuid');

var ScheduleManager = function(options) {
	var jobs = [];

    var recurrenceRuleFactory = function (schedule) {
        var recurrence = new scheduler.RecurrenceRule();
        recurrence.dayOfWeek = schedule.wakeUp.dayOfWeek;
        recurrence.hour = schedule.wakeUp.hour;
        recurrence.minute = schedule.wakeUp.minute;
        return recurrence;
    };
    
    var changeSource = function (uuid, sourceId) {
        return function () {
            var device = options.manager.getDevice(uuid);
            if (device) {
                options.manager.changeSource(device, sourceId);
            }
        }
    };

    if (!storage.getItem('schedules.json')) {
        storage.setItem('schedules.json', []);
    }

    var scheduleJobs = function () {
        _.each(jobs, function (job) {
            job.cancel();
        });
        jobs = _.map(storage.getItem('schedules.json'), function (schedule) {
            return scheduler.scheduleJob(recurrenceRuleFactory(schedule), changeSource(schedule.uuid, schedule.source));
        });
    };

    this.wakeUpSchedulesFor = function (uuid) {
        return _.chain(storage.getItem('schedules.json'))
            .filter(function(schedule) {
                return schedule.uuid === uuid;
            })
            .pluck('wakeUp')
            .value();
    };

    this.addWakeUpScheduleFor = function (uuid, schedule) {
        var schedules = storage.getItem('schedules.json');
        var wakeUp = {
            id: guid.v1(),
            uuid: uuid,
            source: 1,
            wakeUp: schedule
        };
        schedules.push(wakeUp)
        storage.setItem('schedules.json', schedules);
        scheduleJobs();
        return wakeUp;
    }

    this.deleteWakeUpSchedule = function (uuid, id) {
        var schedules = storage.getItem('schedules.json');
        var newSchedules = _.reject(schedules, function (wakeUpSchedule) {
            return wakeUpSchedule.uuid === uuid && wakeUpSchedule.id == id;
        });
        if (newSchedules.length < schedules.length) {
            storage.setItem('schedules.json', newSchedules);
            scheduleJobs();
            return true;
        }
        return false;
    }

    scheduleJobs();
}

storage.initSync();
util.inherits(ScheduleManager, EventEmitter);
exports.ScheduleManager = ScheduleManager;