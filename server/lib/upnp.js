var url = require('url');
var http = require('http');

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

    var params = {
        host: deviceUrl.hostname,
        port: deviceUrl.port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Accept': 'text/xml',
            'SOAPAction': service + '#' + fnName,
            'Content-length': buffer.length
        }
    };

    var req = http.request(params, callback);
    req.write(buffer);
    req.end();

    return req;
}
module.exports.soapRequest = soapRequest;