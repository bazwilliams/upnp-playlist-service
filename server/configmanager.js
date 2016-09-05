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

function defaultConfig() {
	return configFactory(process.env.MUSIC_ROOT, process.env.PLAYLIST_PATH);
}

exports.config = function() {
	if (dirty) {
		cachedConfig = storage.getItemSync('/config/configuration.json');
		dirty = false;
	}
	return cachedConfig || defaultConfig();
};

exports.storeConfiguration = function(newConfig, callback) {
	storage.setItem('/config/configuration.json', configFactory(newConfig.musicRoot, newConfig.playlistPath), function(err) {
		if (err) {
			callback(err);
		} else {
			cachedConfig = newConfig;
			dirty = false;
            callback();
		}
	});
};

var configLocation = process.env.CONFIG_LOCATION;

if (!configLocation) {
	storage.initSync();
} else {
	storage.initSync({
		dir: configLocation
	});
}
