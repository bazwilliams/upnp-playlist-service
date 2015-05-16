var config = require('../../config.js');

exports.list = function listConfiguration(req, res) {
	res.status(200).send(config);
};