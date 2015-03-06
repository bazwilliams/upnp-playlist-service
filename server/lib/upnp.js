var url     = require("url");
var http    = require("http");
var dgram   = require("dgram");
var util    = require("util");
var events  = require("events");
var _       = require("underscore");
var ip      = require("ip");

// SSDP
const SSDP_PORT = 1900;
const BROADCAST_ADDR = "239.255.255.250";
const SSDP_ALIVE = 'ssdp:alive';
const SSDP_BYEBYE = 'ssdp:byebye';
const SSDP_UPDATE = 'ssdp:update';
const SSDP_ALL = 'ssdp:all';

// Map SSDP notification sub type to emitted events 
const UPNP_NTS_EVENTS = {
  'ssdp:alive': 'DeviceAvailable',
  'ssdp:byebye': 'DeviceUnavailable',
  'ssdp:update': 'DeviceUpdate'
};

function ControlPoint() {
  events.EventEmitter.call(this);
  // var self = this;
  // this.server.on('message', function(msg, rinfo) {self.onRequestMessage(msg, rinfo);});
  // this._initParsers();
  // this.server.bind(SSDP_PORT, function () {
    // self.server.addMembership(BROADCAST_ADDR);
  // });
}
util.inherits(ControlPoint, events.EventEmitter);
exports.ControlPoint = ControlPoint;

/**
 * Message handler for HTTPU request.
 */
// ControlPoint.prototype.onRequestMessage = function(msg, rinfo) {
//   var ret = this.requestParser.execute(msg, 0, msg.length);
//   if (!(ret instanceof Error)) {
//     var req = this.requestParser.incoming;
//     switch (req.method) {
//       case 'NOTIFY':
//         debug('NOTIFY ' + req.headers.nts + ' NT=' + req.headers.nt + ' USN=' + req.headers.usn);
//         var event = UPNP_NTS_EVENTS[req.headers.nts];
//         if (event) {
//           this.emit(event, req.headers);
//         }
//         break;
//     };
//   }
// };

// /**
//  * Initialize HTTPU response and request parsers.
//  */
// ControlPoint.prototype._initParsers = function() {
//   var self = this;
//   if (!self.requestParser) {
//     self.requestParser = http.parsers.alloc();
//     self.requestParser.reinitialize('request');
//     self.requestParser.onIncoming = function(req) {

//     };
//   }
// };

function messageHeaders(msg) {
  return msg.toString('ascii').split('\r\n');
}

function splitHeader(header) {
  var result, tuple = header.split(': ');
  if (tuple[1]) {
    var result = {};
    result[tuple[0].toLowerCase()] = tuple[1];
  }
  return result;
}

ControlPoint.prototype.onMSearchResponseMessage = function(msg, rinfo) {
    var headers = messageHeaders(msg);
    if (headers[0] === 'HTTP/1.1 200 OK') {
      var device = _.chain(headers)
        .map(splitHeader)
        .compact()
        .reduce(function (memo, object) { return _.extend(memo, object); })
        .value();
      this.emit("DeviceFound", device);
    }
}

ControlPoint.prototype.search = function(st) {
  if (typeof st !== 'string') {
    st = SSDP_ALL;
  }

  var message = 
    "M-SEARCH * HTTP/1.1\r\n"+
    "Host:"+BROADCAST_ADDR+":"+SSDP_PORT+"\r\n"+
    "ST:"+st+"\r\n"+
    "Man:\"ssdp:discover\"\r\n"+
    "MX:2\r\n\r\n",
    self = this,
    client = dgram.createSocket({ type: 'udp4', reuseAddr: true }),
    server = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  server.on('message', function(msg, rinfo) {
    self.onMSearchResponseMessage(msg, rinfo);
  });

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
}

function soapRequest(deviceUrlRoot, path, service, fnName, fnParams, callback) {
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
exports.soapRequest = soapRequest;

//TODO - Need to handle incoming requests more usefully attributing them to their subscription and device
// var httpSubscriptionResponseServer = http.createServer();
// httpSubscriptionResponseServer.listen(22333);

// httpSubscriptionResponseServer.on('request', function(request, response) {
//   var body = '';
//   request.setEncoding('utf8');
//   request.on('data', function (chunk) {
//       body += chunk;
//   });
//   request.on('end', function () {
//     console.log(body);
//   });
// });
//End todo bit...

// var subscribe = function(host, port, eventSub) {
//   var timeout = 30;

//   http.request({
//     host: host,
//     port: port,
//     path: eventSub,
//     method: 'SUBSCRIBE',
//     headers: {
//       'CALLBACK': "<http://" + ip.address() + ':' + 22333 + ">",
//       'NT': 'upnp:event',
//       'TIMEOUT': 'Second-'+timeout
//     }
//   }).end();
// }
// exports.subscribe = subscribe;

/**
 * Terminates this ControlPoint.
 */
ControlPoint.prototype.close = function() {
  this.server.close();
}