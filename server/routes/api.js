var _ = require('underscore');

var DeviceManager = require('../devicemanager.js').DeviceManager;
var ScheduleManager = require('../schedulemanager.js').ScheduleManager;
var playlistManager = require('../playlistmanager.js');

var manager = new DeviceManager();
var scheduleManager = new ScheduleManager({manager : manager});


/*
 * Serve JSON to our AngularJS client
 */

var convertSchedule = function(schedule) {
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
		hour: schedule.wakeUp.hour,
		minute: schedule.wakeUp.minute,
		links: [{
			rel: 'delete',
			href: '/api/devices/'+schedule.uuid+'/wake-up/'+schedule.id
		}]
	};
}

exports.devices = function(req, res) {
    var devices = _.map(manager.getDevices(), function (uuid) { 
        var device = manager.getDevice(uuid); 
        return {
            uuid: uuid,
            icon: device.icon,
            name: device.name,
            schedules: _.map(scheduleManager.wakeUpSchedulesFor(uuid), convertSchedule),
            links: [{
            	rel: 'store-playlist',
            	href: '/api/devices/' + uuid + '/playlist/'
            },{
            	rel: 'add-wakeup',
            	href: '/api/devices/' + uuid + '/wake-up'
            }]
        }
    });
    res.json(devices);
};

exports.setWakeUp = function(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    var dayOfWeek = [];
    _.each(_.keys(req.body.days), function (key) {
    	var result = ['sun','mon','tue','wed','thu','fri','sat'].indexOf(key);
    	if (result !== void 0 && req.body.days[key]) {
    		dayOfWeek.push(result);
    	}
    });
    if (device) {
        var schedule = {
            dayOfWeek: dayOfWeek,
            hour: parseInt(req.body.hour,10),
            minute: parseInt(req.body.minute,10)
        };
        if (_.isArray(schedule.dayOfWeek) && _.isNumber(schedule.hour) && _.isNumber(schedule.minute)) {
            var wakeUp = scheduleManager.addWakeUpScheduleFor(uuid, schedule);
            if (wakeUp) {
	            res.location('/device/'+uuid+'/wake-up/'+wakeUp.id);
	            res.send(201, schedule);
	        } else {
	        	res.send(400);
	        }
        } else {
            res.send(400);
        }
    }
    res.send(404);
};

exports.deleteWakeUp = function(req, res) {
    var uuid = req.params.uuid;
    var id = req.params.id;
    if (scheduleManager.deleteWakeUpSchedule(uuid, id)) {
        res.send(204);
    } else {
    	res.send(404);
	}
};

exports.storePlaylist = function(req, res) {
    var uuid = req.params.uuid;
    var playlistName = req.params.playlistName;
    var device = manager.getDevice(uuid);
    if (device) {
        playlistManager.savePlaylist(device, playlistName);
        res.send(201);
    } else {
    	res.send(404);
	}
};