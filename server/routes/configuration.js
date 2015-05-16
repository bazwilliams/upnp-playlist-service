var config = require('../../config.js');

exports.list = function listConfiguration(req, res) {
	res.status(200).send(config);
};

exports.store = function storeConfiguration(req, res) {
	res.sendStatus(200);
};