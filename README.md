DS Service
==========

Node.js based system for monitoring a suite of UPNP renderers on a network. A simple wake up system exists which can be configured to wake a DS given a UUID and change it to a particular source. It is intended to run all the time so it can discover your renderers and control them. 

Place a file with the following contents in a folder called 'persist' named 'schedules.json':

```javascript
[
  {
    "uuid": <<UUID of your DS>>,
    "source": 1,
    "wakeUp": {
      "dayOfWeek": <<array of numeric days of week, e.g. [1,2,3,4,5] for weekdays>>
      "hour": <<24 hour clock hour>>,
      "minute": <<minute>>
    }
  }
]
```

You can have multiple schedules for a single UUID or multiple UUIDs. 

Installation
============

Clone this repository onto your server and run `app.js` with node. 

An upstart script has been included in `etc/init/ds-service.conf` which assumes you have cloned the repository into `/opt/upnp-playlist-service` it also assumes you have node.js installed and have a user called `nodejs` which has read and write privileges to the `/opt/upnp-playlist-service/persist` folder. Copy this into your `/etc/init/` folder. 

Future Plans
============

As the repo name suggests, the intention is to download your playlists on your renderers and store them with the ability to restore them or move them to other renderers. If I can reverse the URIs stored within the playlist back to a file (like you can with Minimserver) I'd like to be able to generate a .m3u file which your media server can serve back up allowing you to restore a playlist through your usual upnp controller. 
