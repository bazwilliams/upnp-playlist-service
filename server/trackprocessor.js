var config = require('../config.js');

exports.translate = function(uri) {
    if (uri.indexOf('http:') === 0) {
        return path.join(config.musicRoot, decodeURIComponent(uri.replace(/http:.*\/minimserver\/\*\/[^\/.]*\//, '').replace(/\*/g, '%')));
    } else {
        return uri;
    }
};