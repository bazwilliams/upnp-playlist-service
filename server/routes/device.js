var manager = require('../devicemanager.js');
var scheduleManager = require('../schedulemanager.js');
var _ = require('underscore');
var zpad = require('zpad');
var async = require('async');
var recipes = require('../recipes.js');

function responseHandler(res) {
    return function handler(err, results) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(results);
        }
    };
}
function noResponseHandler(res) {
    return function handler(err, results) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.sendStatus(204);
        }
    };
}
function toScheduleResourceUsingNamedSources(sourceList) {
    return function toScheduleResource(schedule) {
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
                sourceName: sourceList[schedule.actions.sourceId] ? sourceList[schedule.actions.sourceId].Name : void 0,
                links: [{
                    rel: 'delete',
                    href: '/api/devices/'+schedule.uuid+'/schedules/'+schedule.id
                }]
            };
        }
    }
}
function toSourceResource(source, index) {
    if (source && source.Visible === 'true') {
        return {
            index: index,
            name: source.Name,
            type: source.Type
        };
    }
}
function toDeviceResource(deviceModel, callback) {
    callback(null, {
        uuid: deviceModel.uuid,
        icon: deviceModel.device.icon,
        name: deviceModel.device.name,
        room: deviceModel.device.name.split(':')[0],
        schedules: _.map(deviceModel.schedules, toScheduleResourceUsingNamedSources(deviceModel.sources)),
        sources: _.chain(deviceModel.sources)
                  .map(toSourceResource)
                  .compact()
                  .value(),
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
function createDeviceModel(uuid, callback) {
    async.parallel({
        schedules: function listSchedules(iterCallback) {
            scheduleManager.list(uuid, iterCallback);
        },
        sources: function listSources(iterCallback) {
            manager.getDevice(uuid).ds.getSources(iterCallback);
        }
    }, function (err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                uuid: uuid,
                device: manager.getDevice(uuid),
                schedules: results.schedules, 
                sources: results.sources
            });
        }
    });
}
exports.volumeUp = function volumeUp(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        recipes.volumeUp(device.ds, req.body.increment || 1, noResponseHandler(res));
    } else {
        res.sendStatus(404);
    }
};
exports.volumeDown = function volumeDown(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        recipes.volumeDown(device.ds, req.body.decrement || 1, noResponseHandler(res));
    } else {
        res.sendStatus(404);
    }
};
exports.toggleStandby = function toggleStandby(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        recipes.toggleStandby(device.ds, responseHandler(res));
    } else {
        res.sendStatus(404);
    }
};
exports.list = function list(req, res) {
    async.waterfall([
        function getUuids(iterCallback) {
            iterCallback(null, manager.getDevices());
        },
        function createDeviceModels(uuids, iterCallback) {
            async.map(uuids, createDeviceModel, iterCallback);
        },
        function toResource(results, iterCallback) {
            async.map(results, toDeviceResource, iterCallback);
        }
    ], responseHandler(res));
};