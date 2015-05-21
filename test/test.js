var expect = require('chai').expect;

describe('Test', function () {
	var t;
	beforeEach(function () {
		t = 'test';
	});
	it('t should be set', function () {
		expect(t).to.be.eql('test');
	});
});