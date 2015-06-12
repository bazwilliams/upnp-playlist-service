var express = require('express');
var bodyParser = require('body-parser');
var app = module.exports = express();
var port = process.env.PORT || 18080;
var morgan = require('morgan');
var api = require('./routes');
var logger = require('./logger.js');

/**
 * Configuration
 */

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

app.get('/configuration', function (req, res) {
	res.render('configuration');
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
app.get('/api/configuration', api.configuration.list);
app.put('/api/configuration', api.configuration.store);

/**
 * Start Server
 */
app.listen(port, function () {
    logger.info('Express server listening on port ' + port);
});