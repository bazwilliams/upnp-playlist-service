var storage = require('./lib/node-persist.js');

var config = {};

exports.config = function() {
	return config;
};

exports.storeConfiguration = function(newConfig, callback) {
	config = newConfig;
	storage.setItem('configuration.json', newConfig, callback);
}

storage.getItem('configuration.json', function (err, data) {
	if (err) {
		console.err(err);
	} else if (data) {
		config = data;
	}
});