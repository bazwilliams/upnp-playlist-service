"use strict";

var storage = require('node-persist');
var scheduler = require('node-schedule');
var _ = require('underscore');
var guid = require('node-uuid');
var manager = require('openhome-devices-manager');
var recipes = require('./recipes.js');
var logger = require('./logger.js');

var jobs = [];

function recurrenceRuleFactory(schedule) {
    var recurrence = new scheduler.RecurrenceRule();
    recurrence.dayOfWeek = schedule.dayOfWeek;
    recurrence.hour = schedule.hour;
    recurrence.minute = schedule.minute;
    return recurrence;
}
function actionsTasks(uuid, actions, callback) {
    return function () {
        var device = devices.getDevice(uuid);
        if (device) {
            if (actions.setStandby) {
                device.ds.powerOff(callback);
            } else {
                recipes.play(device.ds, actions.sourceId, actions.playlistName, true, actions.radioChannel, callback);
            }
        } else {
            callback(new Error("Device with UUID (" + uuid + ") not found"));
        }
    };
}
function scheduleJobs() {
    function callback(err) {
        if (err) {
            logger.error(err);
        }
    }
    _.each(jobs, function (job) {
        job.cancel();
    });
    storage.getItem('actions.json', function scheduleLoadedJobs(err, schedules) {
        if (err) {
            callback(err);
        } else {
            jobs = _.map(schedules, function (schedule) {
                return scheduler.scheduleJob(recurrenceRuleFactory(schedule.schedule), actionsTasks(schedule.uuid, schedule.actions, callback));
            });
        }
    });
}
function scheduleAndReturnCallback(callback, returnVal) {
    return function scheduleAndReturn(err) {
        if (err) {
            callback(err);
        } else {
            scheduleJobs();
            callback(null, returnVal);
        }
    };
}
exports.list = function list(uuid, callback) {
    storage.getItem('actions.json', function findMatchingJobs(err, schedules) {
        if (err) {
            callback(err);
        } else {
            callback(null, _.where(schedules, { uuid: uuid }));
        }
    });
};
exports.addSchedule = function addSchedule(uuid, schedule, callback) {
    if (schedule.dayOfWeek.length > 0) {
        storage.getItem('actions.json', function addValidSchedule(err, schedules) { 
            if (err) {
                callback(err);
            } else {
                var action = {
                    id: guid.v1(),
                    uuid: uuid,
                    actions: {
                        setStandby: schedule.isStandby,
                        sourceId: schedule.sourceId,
                        playlistName: schedule.playlistName,
                        radioChannel: schedule.radioChannel
                    },
                    schedule: {            
                        dayOfWeek: schedule.dayOfWeek,
                        hour: schedule.hour,
                        minute: schedule.minute
                    }
                };
                var newSchedules = _.clone(schedules);
                newSchedules.push(action);
                storage.setItem('actions.json', newSchedules, scheduleAndReturnCallback(callback, action));
            }
        });
    } else {
        callback(new Error("No days of week set"));
    }
};
exports.deleteSchedule = function deleteSchedule(uuid, id, callback) {
    storage.getItem('actions.json', function removeUnwantedSchedules(err, schedules) {
        if (err) {
            callback(err);
        } else {
            var newSchedules = _.reject(schedules, function (schedule) {
                return schedule.uuid === uuid && schedule.id === id;
            });
            if (newSchedules.length < schedules.length) {
                storage.setItem('actions.json', newSchedules, scheduleAndReturnCallback(callback));
            } else {
                callback(new Error("No schedule found"));
            }
        }
    });
};

storage.initSync();

scheduleJobs();