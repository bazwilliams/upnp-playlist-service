var DeviceManager = require('./devicemanager.js').DeviceManager;

var manager = new DeviceManager();

manager.on('discovered', function (uuid) {
    console.log('Discovered: ' + manager.getDevice(uuid).name);
});

manager.on('available', function (uuid) {
    console.log('Available: ' + manager.getDevice(uuid).name);
});

manager.on('remove', function (device) {
    console.log('Removed: ' + device.name);
});