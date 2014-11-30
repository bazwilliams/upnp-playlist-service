var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var http = require('http');
var path = require('path');

var api = require('./routes/api');

var app = module.exports = express();

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 18080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(bodyParser());
app.use(methodOverride());
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
app.get('/api/devices', api.devices);
app.post('/api/devices/:uuid/wake-up', api.setWakeUp);
app.delete('/api/devices/:uuid/wake-up/:id', api.deleteWakeUp);
app.put('/api/devices/:uuid/playlist/:playlistName', api.storePlaylist);
app.post('/api/devices/:uuid/playlist/replace', api.replacePlaylist);

/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});