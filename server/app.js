var express = require('express');
var bodyParser = require('body-parser');
var app = module.exports = express();
var port = process.env.PORT || 18080;
var morgan = require('morgan');
var api = require('./routes');
/**
 * Configuration
 */

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/', express.static(__dirname +  '/../public'));
app.use('/bower_components',  express.static(__dirname + '/../bower_components'));

/**
 * Routes
 */

// serve index and view partials
app.get('/', function (req, res) {
	res.render('index');
});

// JSON API
app.get('/api/devices', api.device.list);
app.get('/api/playlists', api.playlist.listPlaylists);
app.post('/api/devices/:uuid/schedules', api.schedule.addSchedule);
app.delete('/api/devices/:uuid/schedules/:id', api.schedule.deleteSchedule);
app.post('/api/devices/:uuid/playlist/replace', api.playlist.replacePlaylist);
app.put('/api/devices/:uuid/playlist/:playlistName', api.playlist.storePlaylist);
app.post('/api/devices/:uuid/playlist/:playlistName', api.playlist.addToPLaylist);

/**
 * Start Server
 */
app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});