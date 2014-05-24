var DeviceManager = require('./devicemanager.js').DeviceManager;
var playlistManager = require('./playlistmanager.js');

var manager = new DeviceManager();

manager.on('discovered', function (uuid) {
	var device = manager.getDevice(uuid);
    console.log('Discovered: ' + device.name + ' with ' + device.serviceList.length + ' services');
    // manager.subscribe(device, 'urn:av-openhome-org:service:Playlist:1');
    playlistManager.savePlaylist(device);
});

// manager.on('available', function (uuid) {
//     console.log('Available: ' + manager.getDevice(uuid).name);
// });

// manager.on('remove', function (device) {
//     console.log('Removed: ' + device.name);
// });