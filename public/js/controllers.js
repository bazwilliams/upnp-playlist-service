(function() {
    "use strict";
    var refreshDevices, refreshPlaylists;
    function updateDeviceSources(scope) {
        _.each(scope.devices, function(device) {
            var playlistSource = _.findWhere(device.sources, { 'type' : 'Playlist' });
            device.whatCanPlay = [];
            _.each(device.sources, function (source, index) {
                device.whatCanPlay.push({
                    index: source.index,
                    sourceName: source.name,
                    playlistName: ''
                });
            });
            if (playlistSource && scope.playlists) {
                _.each(scope.playlists, function (playlistName) {
                    device.whatCanPlay.push({
                        index: playlistSource.index,
                        sourceName: playlistSource.name + ': ' + playlistName,
                        playlistName: playlistName
                    });
                });
            }
        });
    }
    function getDeviceRefresh(scope, http) {
        return function () {
            http({
                method: 'GET',
                url: '/api/devices'
            }).success(function (data, status, headers, config) {
                scope.devices = data;
                updateDeviceSources(scope);
            });
        };
    }
    function getPlaylistRefresh(scope, http) {
        return function () {
            http({
                method: 'GET',
                url: '/api/playlists'
            }).success(function (data, status, headers, config) {
                scope.playlists = data;
                updateDeviceSources(scope);
            });
        };
    }
    angular.module('upnpControllers', [])
        .controller('AppCtrl', ['$scope', '$http', function ($scope, $http) {
            if (!$scope.playlists) { 
                $scope.playlists = [];
            }
            refreshDevices = getDeviceRefresh($scope, $http);
            refreshDevices();
            refreshPlaylists = getPlaylistRefresh($scope, $http);
            refreshPlaylists();
        }])
        .controller('DeviceCtrl', ['$scope', '$http', function ($scope, $http) {
            var dsStorePlaylist = _.findWhere($scope.device.links, { 'rel' : 'store-playlist' });
            var dsAppendPlaylist = _.findWhere($scope.device.links, { 'rel' : 'add-to-playlist' });
            var dsPlaymusic = _.findWhere($scope.device.links, { 'rel' : 'play-music' });
            $scope.alerts = [];
            $scope.addAlert = function addAlert(type, message) {
                var alert = { type: type, msg: message };
                $scope.alerts.push(alert);
                setTimeout(function autoremoveAlert() {
                    var indexToRemove = $scope.alerts.indexOf(alert);
                    $scope.closeAlert(indexToRemove);
                }, 3000);
            };
            $scope.closeAlert = function(index) {
                $scope.alerts.splice(index, 1);
            };
            $scope.storePlaylist = function storePlaylist(playlistName) {
                if (!playlistName) {
                    playlistName = '';
                }
                if (dsStorePlaylist) {
                    $http({
                        method: 'PUT',
                        url: dsStorePlaylist.href + playlistName
                    })
                    .success(function () {
                        $scope.addAlert('success', 'Playlist ' + playlistName + ' created');
                        refreshPlaylists();
                    })
                    .error(function (data, status, headers, config) {
                        $scope.addAlert('danger', 'Store Playlist Failed: ' + data + ' (' + status + ')');
                    });
                }
            };
            $scope.appendPlaylist = function appendPlaylist(playlistName) {
                if (!playlistName) {
                    playlistName = '';
                }
                if (dsAppendPlaylist) {
                    $http({
                        method: 'POST',
                        url: dsAppendPlaylist.href + playlistName
                    })
                    .success(function (data) {
                        $scope.addAlert('success', 'Added: ' + data.artist + ' / ' + data.title);
                        refreshPlaylists();
                    })
                    .error(function (data, status, headers, config) {
                        $scope.addAlert('danger', 'Add Track Failed: ' + data + ' (' + status + ')');
                    });
                }
            };
            $scope.playMusic = function playMusic(playlistName) {
                if (!playlistName) {
                    playlistName = '';
                }
                if (dsPlaymusic) {
                    $http({
                        method: 'POST',
                        url: dsPlaymusic.href,
                        data: { playlistName: playlistName }
                    });
                }
            };
            $scope.newSchedule = {
                days: {
                    'mon' : false,
                    'tue' : false,
                    'wed' : false,
                    'thu' : false,
                    'fri' : false,
                    'sat' : false,
                    'sun' : false
                },
                playlistName: '',
                action: 'wake',
                sourceName: $scope.device.whatCanPlay[0].sourceName,
                time: ''
            };
            $scope.toggleDay = function toggleDay(dayOfWeek) {
                if ($scope.newSchedule.days[dayOfWeek] !== void 0) {
                    $scope.newSchedule.days[dayOfWeek] = !$scope.newSchedule.days[dayOfWeek];
                }
            };
            $scope.addWakeUp = function addWakeUp(newSchedule) {
                var result = _.findWhere($scope.device.links, { 'rel' : 'add-schedule' });
                var selectedSource = _.findWhere($scope.device.whatCanPlay, { sourceName: newSchedule.sourceName });
                var body = {
                    days : newSchedule.days,
                    time: newSchedule.time,
                    action: newSchedule.action,
                    playlistName: selectedSource ? selectedSource.playlistName : void 0,
                    sourceId: selectedSource ? selectedSource.index : void 0
                };
                $http({
                    method: 'POST',
                    url: result.href,
                    data: body
                })
                .success(function () {
                    refreshDevices();
                });
            };
            $scope.deleteWakeUp = function deleteWakeUp(schedule) {
                var result = _.findWhere(schedule.links, { 'rel' : 'delete' });
                if (result) {
                    $http({
                        method: 'DELETE',
                        url: result.href
                    })
                    .success(function () {
                        refreshDevices();
                    });
                }
            };
            $scope.isExistingPlaylist = function isExistingPlaylist(playlistName) {
                return $scope.playlists.indexOf(playlistName) > -1;
            };
        }]);
}());