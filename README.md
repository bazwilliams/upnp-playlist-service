[![Build Status](https://travis-ci.org/bazwilliams/upnp-playlist-service.svg?branch=master)](https://travis-ci.org/bazwilliams/upnp-playlist-service) [![](https://images.microbadger.com/badges/image/bazwilliams/upnp-playlist-service.svg)](http://microbadger.com/images/bazwilliams/upnp-playlist-service "Get your own image badge on microbadger.com") [![](https://images.microbadger.com/badges/version/bazwilliams/upnp-playlist-service.svg)](http://microbadger.com/images/bazwilliams/upnp-playlist-service "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/commit/bazwilliams/upnp-playlist-service.svg)](http://microbadger.com/images/bazwilliams/upnp-playlist-service "Get your own commit badge on microbadger.com") [![](https://images.microbadger.com/badges/license/bazwilliams/upnp-playlist-service.svg)](http://microbadger.com/images/bazwilliams/upnp-playlist-service "Get your own license badge on microbadger.com")

# DS Service

Node.js based system for monitoring a suite of UPNP renderers on a network. It is intended to run all the time so it can discover your renderers and provides the following control features:

* Scheduled wake up to specified playlist, radio station or input source
* Scheduled sleep
* Save a playlist on a DS and store for later replay
* Build a new playlist from currently playing track on any Upnp device
* Append currently playing track on any Upnp device to any existing playlist
* Webpage to configure scheduled wakeup and sleep
* Webpage to manipulate and playback stored playlists

The playlist functionality has been optimised for mobile use. 

Playlists already on a DS can be saved in their entirety for later playback either through the app or used as part of a schedule. 

A playlist builder function exists to add tracks from any playing DS onto any playlist. 

## Breaking Changes

* Dropped support for `.deb` installation. See Installation/Docker. 
* Dropped support for creating `m3u` playlists referencing local content. See Further Options/Migrating Existing m3u Playlists.

## Installation

### Docker

```
docker run -d --restart=always -e TZ=<TIMEZONE> --net=host -v <DATA>:/data bazwilliams/upnp-playlist-service
```

* TIMEZONE - Your TZ timezone, e.g. Europe/London - see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
* DATA - folder on host machine where you want playlists and schedules stored

_If you do not set a time zone, the Docker will start in UTC and any schedules you add will also need to be UTC_

### Not Docker

Clone this repository onto your server and perform an npm install which will install all the dependencies.

I've had reports running this application as a Windows service using Winser works well http://jfromaniello.github.io/winser/.

Alternatively, npm start within the repository in a command prompt.

#### Further options

##### Alternative TCP Port

If you wish the service to run on something other than TCP port 3000, you can override by passing in a `PORT` environment variable. E.g. `-e PORT=18080`

##### Migrate Existing Saved m3u Playlists

This version uses a different mechanism to store playlists, to migrate your old stored playlists saved with this application do the following: 

```
docker run -d --net=host -v <DATA>:/data -v <PLAYLISTS>:/playlists bazwilliams/upnp-playlist-service migrate
```

* DATA - folder on host machine where you want playlists and schedules stored
* PLAYLISTS - folder on host machine where your original playlists were stored, these will not be changed

## Schedule

Use the following URL to view your devices and manage schedules. 

http://localhost:3000/

## Playlist

To view playlists.

http://localhost:3000/playlists

*Dashboard for viewing schedules on a DS*

![Control For a DS](https://raw.githubusercontent.com/bazwilliams/upnp-playlist-service/master/docs/control-ui-screenshot.png)

*Options for setting what to play when being woken from standby*

![Playlists shown for what to play](https://raw.githubusercontent.com/bazwilliams/upnp-playlist-service/master/docs/what-to-play-screenshot.png)

*Dashboard for managing playlists on a DS*

![Existing Playlist for a DS](https://raw.githubusercontent.com/bazwilliams/upnp-playlist-service/master/docs/playlist-ui-screenshot.png)
![Creating Playlist for a DS](https://raw.githubusercontent.com/bazwilliams/upnp-playlist-service/master/docs/playlist-ui-create-screenshot.png)

## API

GET `/api/devices` to see a list of all discovered devices on your network, all wake up schedules will be included under `device.schedules`. Each of which will include a link-rel to delete that wake up by sending a DELETE to it. 

### Playlists

GET `/api/playlists` to see a list of all saved playlists.
GET `/api/playlists?search=<NAME>` to search for a saved playlist by NAME
GET `/api/playlists/{playlistName}` to see the contents of a saved playlist

#### To add currently playling track to a new or existing playlist

POST to `/api/devices/{uuid}/playlists/{playlistName}`

_No body required_

#### To store a playlist already in a DS

PUT to `/api/devices/{uuid}/playlists/{playlistName}`

_No body required_

#### To toggle the standby state of a DS

POST to `/api/devices/{uuid}/toggle-standby`

No body is required. The resulting standby state is provided in the response. 

#### To adjust volume up

POST to `/api/devices/{uuid}/volume-up`

```javascript
{
    "increment": "{increment}"
}
```

Where increment is a number of the amount you wish the volume to be added by, if empty it defaults to 1. 

#### To adjust volume down

POST to `/api/devices/{uuid}/volume-down`

```javascript
{
    "decrement": "{increment}"
}
```

Where decrement is a number of the amount you wish the volume to be reduced by, if empty it defaults to 1. 

#### To skip current playing track on a DS

POST to `/api/devices/{uuid}/skip`

_No body required_

#### To pause current playing track on a DS

POST to `/api/devices/{uuid}/pause`

_No body required_

#### To resume current playing track on a DS

POST to `/api/devices/{uuid}/resume`

_No body required_

#### To retrieve information about currently playing track

GET to `/api/devices/{uuid}/info`

#### To playback a playlist in a DS

Loading a playlist and starting playback is supported. However, if the metadata should change, or the URI to the original track or artwork change, the track may not work as expected. Therefore this facility is only reliable if track URI and metadata are not changed. 

POST to `/api/devices/{uuid}/play` with Content-Type `application/json` with the following body. No suffix is required for the playlistName. This will clear the DS onboard playlist first and load the one from file and start playing from the first track. 

To shuffle the playlist, set 'random' to true. 

If the playlistName is empty, the radio source will be selected and play. 

```javascript
{
    "playlistName": "{playlistName}",
    "random": "[true|false]"
}
```

### Alarm Clock Function

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
    "action": "(sleep|wake)",
    "playlistName": "{playlist}"
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
    "action": "wake",
    "playlistName": ""
}
```

The response will have status 201 if successful, 404 if the device hasn't been discovered and 400 if the body is not valid. 

The header will contain location URI to which you can send a DELETE to remove the alarm. 

The response body will contain the schedule you posted. 

You can have multiple schedules for a single UUID or multiple UUIDs. 

If you include a value within the playlistName attribute of the javascript object, then this playlist will be loaded into the DS and started from the beginning. If it is empty, the radio is assumed. 

### Sleep Timer

To set a sleep timer where the device will automatically go to sleep after a given number of minutes perform a POST to `/api/devices/{uuid}/sleep-timer` with a `Content-Type` of `application/json` with the following body where minutes is an integer for the number of minutes you want the device to stay awake for:

```javascript
{
    "minutes" : {minutes}
}
```

If a timer existed already, you will see a 200 response, 201 if a timer was new. 

You can delete an existing sleep timer by sending a DELETE to `/api/devices/{uuid}/sleep-timer`. You will always receive a 204 response. 

To put the device to sleep immediately, you can set the number of minutes to be 0 or negative. 

## Credits

*Font Awsome*

Font Awesome by Dave Gandy: http://fontawesome.io

*Icons*

Radio Icon: https://www.iconfinder.com/icons/111101/radio_icon

Playlist Icon: https://www.iconfinder.com/icons/111102/music_nodes_icon

Standby Icon: https://www.iconfinder.com/icons/111007/cable_icon

Speaker Icon: https://www.iconfinder.com/icons/111100/speaker_icon

Icons licenced as Creative Commons (Attribution-Share Alike 3.0 Unported) 
http://creativecommons.org/licenses/by-sa/3.0/
