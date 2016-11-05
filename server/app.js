"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const app = module.exports = express();
let port = process.env.PORT || 18080;
const morgan = require('morgan');
const api = require('./routes');
const logger = require('./logger.js');
const storage = require('node-persist');

/**
 * Configuration
 */

storage.initSync(process.env.DATA_LOCATION ? { dir: process.env.DATA_LOCATION } : {});

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(morgan(':remote-addr :method :url :status :response-time', { stream: logger.stream }));
app.use('/', express.static(__dirname +  '/../public'));
app.use('/bower_components',  express.static(__dirname + '/../bower_components'));

/**
 * Routes
 */

// serve index and view partials
app.get('/', function (req, res) {
	res.render('index');
});

app.get('/playlists', function (req, res) {
	res.render('playlists');
});

// JSON API
app.get('/api/devices', api.device.list);
app.get('/api/playlists', api.playlist.listPlaylists);
app.post('/api/devices/:uuid/schedules', api.schedule.addSchedule);
app.delete('/api/devices/:uuid/schedules/:id', api.schedule.deleteSchedule);
app.put('/api/devices/:uuid/playlist/:playlistName', api.playlist.storePlaylist);
app.post('/api/devices/:uuid/playlist/:playlistName', api.playlist.addToPlaylist);
app.post('/api/devices/:uuid/play', api.playlist.playMusic);
app.post('/api/devices/:uuid/toggle-standby', api.device.toggleStandby);
app.post('/api/devices/:uuid/sleep-timer', api.device.setSleepTimer);
app.delete('/api/devices/:uuid/sleep-timer', api.device.clearSleepTimer);
app.post('/api/devices/:uuid/volume-up', api.device.volumeUp);
app.post('/api/devices/:uuid/volume-down', api.device.volumeDown);
app.get('/api/devices/:uuid/radio-stations', api.device.listRadioStations);
app.post('/api/devices/:uuid/skip-track', api.device.skipTrack);
app.get('/api/devices/:uuid/info', api.device.info);

/**
 * Start Server
 */
app.listen(port, function () {
    logger.info('Express server listening on port ' + port);
});
