"use strict";

const levDist = require("levdist");
const _ = require('underscore');

function filter(item) {
    return item.toLowerCase();
}

module.exports = function(data) {
    return {
        search: (query, items) => {
            let d =_.chain(data)
                .map(function(item) {
                    return {
                        o: item,
                        w: filter(item),
                        l: levDist(filter(query), filter(item))
                    };
                })
                .sortBy('l')
                .reject((item) => item.l > (item.w.length * 0.4))
                .pluck('o');
            return d.first(items).value();
        }
    };
};