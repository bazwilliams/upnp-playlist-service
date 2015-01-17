# DS Service

Node.js based system for monitoring a suite of UPNP renderers on a network. It is intended to run all the time so it can discover your renderers and partially control them. 

A wake up and sleep system exists which can be configured to wake, change the source to radio and start playing; play a named saved playlist; or put to sleep a specific DS.  

The playlist functionality has been optimised for mobile use. 

Playlists already on a DS can be saved in their entirety for later playback either through the app or used as part of a schedule. If a track is served from a locally running Minimserver and playlist folders and music locations have been configured correctly, the resulting m3u file can be loaded in any media player or server and those tracks will be referenced correctly. The DIDL-Lite metadata is always stored so the full playlist can be restored through this application. 

A playlist builder function exists to add tracks from any playing DS onto any playlist. If the track is a Minimserver served track, the m3u file will contain a file reference. 

## Installation

Clone this repository onto your server and perform an `npm install` which will install all the dependencies. 

You can configure the path to the root of your music (should be the same as your minimserver content directory) and specify a full path to a folder containing your minimserver served playlists. These are both configured within the `config.js` file. An example configuration file is included under `docs/example-config.js` which should be copied to `config.js`. It should look a bit like this:

```javascript
var config = {};

// Unix locations
//config.musicRoot = '/mnt/media/music';
//config.playlistPath = '/mnt/media/music/Playlists';

// Windows locations
config.musicRoot = 'C:\\Users\\barry\\Dropbox';
config.playlistPath = 'C:\\Users\\barry\\Dropbox\\playlists\\';

module.exports = config;
```

For Linux, a template upstart script has been included in `etc/init/ds-service.conf` which assumes you have cloned the repository into `/opt/upnp-playlist-service` it also assumes you have node.js installed and have a user called `nodejs` which has read and write privileges to the `/opt/upnp-playlist-service/persist` folder. Modify and copy this into your `/etc/init/` folder to enable you to start the service at boot automatically. 

## Running

Start node by running `node server\app.js`

Once running click on the following URL to view your devices and manage schedules. 

http://localhost:18080/

To view playlists.

http://localhost:18080/playlists

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

GET `/api/playlists` to see a list of all M3U files in the configured playlist folder. Any M3U files created by this service can also be loaded back into the DS via the 'replace' button or as part of a schedule. 

Storing the current play queue on a DS as an M3U file is optimised if you are serving your music from a Minimserver media server running on the same machine as a relative path to the original file will be stored in the M3U file. In all cases, the DIDL-LITE metadata will be stored as an M3U comment. 

#### To add currently playling track to a new or existing playlist

POST to `/api/devices/{uuid}/playlists/{playlistName}`

No body is required, the playlistName does not need to include any file suffix (one will be added).

#### To store a playlist already in a DS

PUT to `/api/devices/{uuid}/playlists/{playlistName}`

No body is required, the playlistName does not need to include any file suffix (one will be added). 

#### To toggle the standby state of a DS

POST to `/api/devices/{uuid}/toggle-standby`

No body is required. 

#### To playback a playlist in a DS

Loading a playlist and starting playback is now supported by parsing the DIDL-LITE out of an m3u file. The downsides are if the metadata should change, or the URI to the original track or artwork change, the track may not work as expected. Therefore this facility is only reliable if track URI and metadata are not changed. 

POST to `/api/devices/{uuid}/play` with Content-Type `application/json` with the following body. No suffix is required for the playlistName. This will clear the DS onboard playlist first and load the one from file and start playing from the first track. 

```javascript
{
    "playlistName": "{playlistName}" 
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

## Future Plans

- [X] Playlist builder (add currently playing track to a specific playlist).
- [X] Provide list of existing playlist when loading into DS.
- [X] Provide feedback through the UI when a playlist is stored.
- [ ] Support shuffle playback
- [X] Add device toggle standby API
- [X] Permit overwriting existing playlists.
- [ ] Ability to decide which radio station to play.
- [ ] Skip standby mode if the source has changed (i.e. someone interacted between wakeup and sleep)
- [ ] Easy installation on windows, mac, linux and nas drives.

## Credits

Radio Icon: https://www.iconfinder.com/icons/111101/radio_icon

Playlist Icon: https://www.iconfinder.com/icons/111102/music_nodes_icon

Standby Icon: https://www.iconfinder.com/icons/111007/cable_icon

Icons licenced as Creative Commons (Attribution-Share Alike 3.0 Unported) 
http://creativecommons.org/licenses/by-sa/3.0/    
