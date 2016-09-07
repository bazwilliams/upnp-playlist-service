"use strict";

let m3u = require('./m3u');
let playlistStore = require('../server/playliststore');

require('node-persist').initSync({ dir: process.env.DATA_LOCATION });

m3u.list((err, data) => {
    if (!data) {
        console.error('No playlists');
    } else {
        data.forEach(playlistName => {
            m3u.read(playlistName, (err, data) => {
                playlistStore.write(data, playlistName, (err, data) => { console.log(`Converted ${playlistName}`) });
            });
        });
    }
});

