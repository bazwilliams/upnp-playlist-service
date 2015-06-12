"use strict";
var winston = require('winston');

var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: function() {
                return new Date().toISOString();
            },
            level: 'debug',
            handleExceptions: false,
            json: false,
            colorize: false
        })
    ]
});

var stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

module.exports = {
    stream: stream,
    info: logger.info,
    debug: logger.debug,
    warn: logger.warn,
    error: logger.error
};