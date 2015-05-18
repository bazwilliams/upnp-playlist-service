var configManager = require('../configmanager.js');

exports.list = function listConfiguration(req, res) {
	res.status(200).send(configManager.config());
};

exports.store = function storeConfiguration(req, res) {
	configManager.storeConfiguration(req.body, function (err, data) {
		res.sendStatus(200);
	});
};