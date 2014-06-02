DS Service
==========

Node.js based system for monitoring a suite of UPNP renderers on a network. A simple wake up system exists which can be configured to wake a DS and change it to a particular source. It is intended to run all the time so it can discover your renderers and control them. 

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

Storing the current play queue on a DS as an M3U file is only supported if you are serving your music from a Minimserver media server running on the same machine. 

The create a playlist:

PUT to `/api/devices/{uuid}/playlists/{playlistName}`

No body is required, the playlistName does not need to include any file suffix (one will be added). 

To create an alarm:

POST to `/api/devices/{uuid}/wake-up`

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
    	}
    "time": "{hour}:{minute}"
}
```

E.g. to wake device with UUID 4c494e4e-0026-0f21-cc9a-01320147013f at 10:00 on Sunday and Wednesday: 

`POST /4c494e4e-0026-0f21-cc9a-01320147013f/wake-up`

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
    	}
    "time": "10:00"
}
```

The response will have status 201 if successful, 404 if the device hasn't been discovered and 400 if the body is not valid. 

The header will contain location URI to which you can send a DELETE to remove the alarm. 

The response body will contain the schedule you posted. 

You can have multiple schedules for a single UUID or multiple UUIDs. 

Future Plans
============

Provide feedback through the UI when a playlist is stored

Ability to start with sources other than 1, also send signals to power on and start playing. 

Easy installation on windows, mac, linux and nas drives. 
