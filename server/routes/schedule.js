var _ = require('underscore');
var manager = require('../devicemanager.js');
var scheduleManager = require('../schedulemanager.js');

function convertToSchedule(data) {
    var dayOfWeek = [];
    _.each(_.keys(data.days), function (key) {
        var result = ['sun','mon','tue','wed','thu','fri','sat'].indexOf(key);
        if (result !== void 0 && data.days[key]) {
            dayOfWeek.push(result);
        }
    });
    if (data.time && data.time.split(':').length === 2)
    {
        return {
            dayOfWeek: dayOfWeek,
            hour: parseInt(data.time.split(':')[0],10),
            minute: parseInt(data.time.split(':')[1],10)
        };
    }
}
exports.setWakeUp = function(req, res) {
    var uuid = req.params.uuid;
    var device = manager.getDevice(uuid);
    if (device) {
        var schedule = convertToSchedule(req.body);
        if (schedule && _.isArray(schedule.dayOfWeek) && _.isNumber(schedule.hour) && _.isNumber(schedule.minute)) {
            scheduleManager.addWakeUpScheduleFor(uuid, schedule, function responseHandler(err, wakeUp) {
                if (err) {
                    res.status(400).send(err);
                } else {
                    res.location('/device/' + uuid + '/wake-up/' + wakeUp.id);
                    res.status(201).send(schedule);
                }
            });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(404);
    }
};
exports.deleteWakeUp = function (req, res) {
    var uuid = req.params.uuid;
    var id = req.params.id;
    scheduleManager.deleteWakeUpSchedule(uuid, id, function responseHandler(err, results) {
        if (err) {
            res.status(404).send(err);
        } else {
            res.sendStatus(204);
        }
    });
};