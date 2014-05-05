DS Service
==========

Node.js based system for monitoring a suite of UPNP renderers on a network. A simple wake up system exists which can be configured to wake a DS given a UUID and change it to a particular source. 

Place a file with the following contents in a folder called 'persist' named 'schedule.json':

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
