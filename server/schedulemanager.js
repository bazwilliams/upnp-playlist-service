var storage = require('./lib/node-persist.js');
var scheduler = require('node-schedule');
var _ = require('underscore');
var guid = require('node-uuid');
var async = require('async');
var devices = require('./devicemanager.js');
var playlists = require('./playlists.js');

var jobs = [];

function recurrenceRuleFactory(schedule) {
    var recurrence = new scheduler.RecurrenceRule();
    recurrence.dayOfWeek = schedule.dayOfWeek;
    recurrence.hour = schedule.hour;
    recurrence.minute = schedule.minute;
    return recurrence;
}

function delay(milliseconds) {
    return function (callback) {
        setTimeout(callback, milliseconds);
    };
}

function actionsTasks(uuid, actions, callback) {
    return function () {
        var device = devices.getDevice(uuid);
        if (device) {
            if (actions.setStandby) {
                async.series([
                    device.ds.powerOff
                ], callback);
            } else if (actions.playlistName) {
                async.series([
                    device.ds.powerOn,
                    function(iterCallback) {
                        playlists.replacePlaylist(device.ds, actions.playlistName, iterCallback);
                    },
                    delay(1000),
                    device.ds.playPlaylistFromStart
                ], callback);
            } else {
                async.series([
                    device.ds.powerOn,
                    function(iterCallback) {
                        device.ds.changeSource(actions.sourceId, iterCallback);
                    },
                    delay(1000),
                    device.ds.playRadio
                ], callback);
            }
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
                        sourceId: schedule.playlistName ? 0 : 1,
                        playlistName: schedule.playlistName
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
                return schedule.uuid === uuid && schedule.id == id;
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

if (!storage.getItem('actions.json')) {
    storage.setItem('actions.json', []);
}
scheduleJobs();