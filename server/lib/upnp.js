var url     = require("url");
var http    = require("http");
var dgram   = require("dgram");
var util    = require("util");
var events  = require("events");
var _       = require("underscore");

const SSDP_PORT = 1900;
const BROADCAST_ADDR = "239.255.255.250";
const SSDP_ALIVE = 'ssdp:alive';
const SSDP_BYEBYE = 'ssdp:byebye';
const SSDP_UPDATE = 'ssdp:update';
const SSDP_ALL = 'ssdp:all';

const UPNP_NTS_EVENTS = {
  'ssdp:alive': 'DeviceAvailable',
  'ssdp:byebye': 'DeviceUnavailable',
  'ssdp:update': 'DeviceUpdate'
};

function messageLines(msg) {
  return msg.toString('ascii').split('\r\n');
}

function toKeyPair(header) {
  var result, tuple = header.split(': ');
  if (tuple[1]) {
    var result = {};
    result[tuple[0].toLowerCase()] = tuple[1];
  }
  return result;
}

function mSearchResponseParser(msg, rinfo) {
    var headers = messageLines(msg);
    if (headers[0] === 'HTTP/1.1 200 OK') {
      return _.chain(headers)
        .map(toKeyPair)
        .compact()
        .reduce(_.extend)
        .value();
    }
    return void 0;
}

function notifyResponseParser(msg, rinfo) {
    var headers = messageLines(msg);
    if (headers[0] === 'NOTIFY * HTTP/1.1') {
      return _.chain(headers)
        .map(toKeyPair)
        .compact()
        .reduce(_.extend)
        .value();
    }
    return void 0;
}

function announceDiscoveredDevice(emitter) {
  return function (msg, rinfo) {
    var device = mSearchResponseParser(msg, rinfo);
    if (device) {
      emitter.emit('DeviceFound', device);
    }
  };
}

function announceDevice(emitter) {
  return function (msg, rinfo) {
    var device = notifyResponseParser(msg, rinfo);
    if (device) {
      emitter.emit(UPNP_NTS_EVENTS[device.nts], device);
    }
  };
}

function Upnp() {
    events.EventEmitter.call(this);

    var udpServer = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    udpServer.bind(SSDP_PORT, function () {
      udpServer.addMembership(BROADCAST_ADDR);
    });
    udpServer.on('message', announceDevice(this)) ;

    this.close = function() {
      udpServer.close();
    }

    this.soapRequest = function(deviceUrlRoot, path, service, fnName, fnParams, callback) {
      var deviceUrl = url.parse(deviceUrlRoot);

      var bodyString = '<?xml version="1.0"?>';
      bodyString += '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">';
      bodyString += '  <s:Body s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
      bodyString += '    <u:' + fnName + ' xmlns:u="' + service + '">';
      bodyString += '      ' + fnParams;
      bodyString += '    </u:' + fnName + '>';
      bodyString += '  </s:Body>';
      bodyString += '</s:Envelope>';

      var buffer = new Buffer(bodyString);

      var req = http.request({
          host: deviceUrl.hostname,
          port: 80,
          path: path,
          method: 'POST',
          headers: {
              'Content-Type': 'text/xml',
              'Accept': 'text/xml',
              'SOAPAction': service + '#' + fnName,
              'Content-length': buffer.length
          }
      }, callback);
      req.write(buffer);
      req.end();

      return req;
  };

  this.mSearch = function(st) {
    if (typeof st !== 'string') {
      st = SSDP_ALL;
    }

    var message = 
      "M-SEARCH * HTTP/1.1\r\n"+
      "Host:"+BROADCAST_ADDR+":"+SSDP_PORT+"\r\n"+
      "ST:"+st+"\r\n"+
      "Man:\"ssdp:discover\"\r\n"+
      "MX:2\r\n\r\n";
    
    var server = dgram.createSocket({ type: 'udp4', reuseAddr: true }, announceDiscoveredDevice(this));
    var client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    server.on('listening', function () {
      client.send(new Buffer(message, "ascii"), 0, message.length, SSDP_PORT, BROADCAST_ADDR, function () {
        client.close();
      });
    });

    client.on('listening', function () {
      server.bind(client.address().port);
    });

    client.bind();

    // MX is set to 2, wait for 1 additional sec. before closing the server
    setTimeout(function(){
      server.close();
    }, 3000);
  };
}

util.inherits(Upnp, events.EventEmitter);

module.exports = new Upnp();