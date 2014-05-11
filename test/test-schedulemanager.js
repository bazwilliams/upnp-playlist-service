var rewire = require('rewire');
var sinon = require('sinon');

exports['recurrenceRuleFactory'] = function (test) {
	var scheduleManager = rewire('../schedulemanager.js');

	var scheduler = {
		RecurrenceRule: sinon.stub().returns({})
	};

	scheduleManager.__set__('scheduler', scheduler);

	var testData = {
		dayOfWeek: [0],
		hour: 18,
		minute: 30
	}
	var result = scheduleManager.__get__('recurrenceRuleFactory')(testData);

	test.equals(scheduler.RecurrenceRule.calledOnce, true);
	test.equals(result.dayOfWeek, testData.dayOfWeek);
	test.equals(result.hour, testData.hour);
	test.equals(result.minute, testData.minute);
    test.done();
};