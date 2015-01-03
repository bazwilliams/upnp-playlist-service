DS Service
==========

Node.js based system for monitoring a suite of UPNP renderers on a network. It is intended to run all the time so it can discover your renderers and control them. 

A wake up and sleep system exists which can be configured to wake, change the source to radio and start playing; or put to sleep a specific DS.  

A capability exists to convert a play queue which exists already on a DS which you may have spent a long time preparing to be saved as an m3u file. This only works for Minimserver and requires both this service and minimserver to be running on the same computer. By storing your playlist as an m3u file, you are free to edit metadata and album art without loss. If you store the raw playlist from a Upnp renderer, the metadata is included in the playlist which means it can become out of sync to your original files. 

Installation
============

Clone this repository onto your server and perform an `npm install` which will install all the dependencies. 

You can configure the path to the root of your music (should be the same as your minimserver content directory) and specify a full path to a folder containing your minimserver served playlists. These are both configured within the `config.js` file. 

For Linux, a template upstart script has been included in `etc/init/ds-service.conf` which assumes you have cloned the repository into `/opt/upnp-playlist-service` it also assumes you have node.js installed and have a user called `nodejs` which has read and write privileges to the `/opt/upnp-playlist-service/persist` folder. Modify and copy this into your `/etc/init/` folder to enable you to start the service at boot automatically. 

Running
=======

Start node by running `node server\app.js`

Once running click on the following URL to view your devices, view schedules, store playlists and set wake up alarms. 

http://localhost:18080/

API
===

GET /api/devices to see a list of all discovered devices on your network, all wake up schedules will be included under `device.schedules`. Each of which will include a link-rel to delete that wake up by sending a DELETE to it. 

Playlists
=========

Storing the current play queue on a DS as an M3U file is optimised if you are serving your music from a Minimserver media server running on the same machine. Otherwise, the DIDL-LITE metadata will be stored as an M3U comment. 

The create a playlist:

PUT to `/api/devices/{uuid}/playlists/{playlistName}`

No body is required, the playlistName does not need to include any file suffix (one will be added). 

Loading a playlist into a DS is now supported by parsing the DIDL-LITE out of an m3u file. The downsides are if the metadata should change, or the URI to the original track or artwork change, the track may not work as expected. Therefore this facility is only reliable if track URI and metadata are not changed. 

POST to `/api/devices/{uuid}/playlists/replace` with Content-Type `application/json` with the following body. No suffix is required for the playlistName. This will clear the DS onboard playlist first and load the one from file. 

```javascript
{
    "playlistName": "{playlistName}" 
}
```

Alarm Clock Function
====================

To create an alarm:

POST to `/api/devices/{uuid}/schedules`

```javascript
{
    "days": {
    	"mon" : false,
    	"tue" : false,
    	"wed" : false,
    	"thu" : false,
    	"fri" : false,
    	"sat" : false,
    	"sun" : false
    	},
    "time": "{hour}:{minute}",
    "action": "(sleep|wake)"
}
```

E.g. to wake device with UUID 4c494e4e-0026-0f21-cc9a-01320147013f at 10:00 on Sunday and Wednesday: 

`POST /4c494e4e-0026-0f21-cc9a-01320147013f/schedules`

```javascript
{
    "days": {
    	"mon" : false,
    	"tue" : false,
    	"wed" : true,
    	"thu" : false,
    	"fri" : false,
    	"sat" : false,
    	"sun" : true
    	},
    "time": "10:00",
    "action": "wake"
}
```

The response will have status 201 if successful, 404 if the device hasn't been discovered and 400 if the body is not valid. 

The header will contain location URI to which you can send a DELETE to remove the alarm. 

The response body will contain the schedule you posted. 

You can have multiple schedules for a single UUID or multiple UUIDs. 

Future Plans
============

Provide feedback through the UI when a playlist is stored

Ability to start non radio sources; ability to decide which radio station or perhaps preload a playlist. 

Easy installation on windows, mac, linux and nas drives. 
