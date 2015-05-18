var configManager = require('./configmanager.js');
var path = require('path');

exports.translate = function(uri) {
    if (uri.indexOf('http:') === 0) {
        return path.join(configManager.config().musicRoot, decodeURIComponent(uri.replace(/http:.*\/minimserver\/\*\/[^\/.]*\//, '').replace(/\*/g, '%')));
    } else {
        return uri;
    }
};
