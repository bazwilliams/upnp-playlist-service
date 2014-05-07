DS Service
==========

Node.js based system for monitoring a suite of UPNP renderers on a network. A simple wake up system exists which can be configured to wake a DS given a UUID and change it to a particular source. It is intended to run all the time so it can discover your renderers and control them. 

To create an alarm, send a POST to `/{uuid}/wake-up` with Content-Type `application/json` and the following body:

```javascript
{
    "dayOfWeek": {array of day numbers, sunday is 0},
    "hour": {hour},
    "minute": {minute}
}
```

E.g. to wake device with UUID 4c494e4e-0026-0f21-cc9a-01320147013f at 10:00 on Sunday and Wednesday: 

`POST 4c494e4e-0026-0f21-cc9a-01320147013f/wake-up`

```javascript
{
    "dayOfWeek": [0,3],
    "hour" : 10,
    "minute" : 0
}
```

The response will have status 201 if successful, 404 if the device hasn't been discovered and 400 if the body is not valid. 

The header will contain location URI to which you can send a DELETE to remove the alarm. 

The response body will contain the schedule you posted. 

You can have multiple schedules for a single UUID or multiple UUIDs. 

Installation
============

Clone this repository onto your server, `npm install` and run `app.js` with node. 

An upstart script has been included in `etc/init/ds-service.conf` which assumes you have cloned the repository into `/opt/upnp-playlist-service` it also assumes you have node.js installed and have a user called `nodejs` which has read and write privileges to the `/opt/upnp-playlist-service/persist` folder. Copy this into your `/etc/init/` folder. 

Future Plans
============

Ability to add or edit wakeup schedules through the web application. 

Ability to start with sources other than 1, also send signals to power on and start playing. 

Easy installation on windows, mac and linux. 

As the repo name suggests, the intention is to download your playlists on your renderers and store them with the ability to restore them or move them to other renderers. If I can reverse the URIs stored within the playlist back to a file (like you can with Minimserver) I'd like to be able to generate a .m3u file which your media server can serve back up allowing you to restore a playlist through your usual upnp controller. 
