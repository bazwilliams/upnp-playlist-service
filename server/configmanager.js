"use strict";

var storage = require('node-persist');

var dirty = true;
var cachedConfig = {};

function configFactory(musicRoot, playlistPath) {
	return {
		musicRoot: musicRoot,
		playlistPath: playlistPath
	};
}

exports.config = function() {
	if (dirty) {
		cachedConfig = storage.getItemSync('configuration.json');
		dirty = false;
	}
	return cachedConfig || {};
};

exports.storeConfiguration = function(newConfig, callback) {
	storage.setItem('configuration.json', configFactory(newConfig.musicRoot, newConfig.playlistPath), function(err) {
		if (err) {
			callback(err);
		} else {
			cachedConfig = newConfig;
			dirty = false;
            callback();
		}
	});
};