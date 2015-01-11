'use strict';

/* Controllers */

function getDeviceRefresh(scope, http) {
    return function () {
        http({
            method: 'GET',
            url: '/api/devices'
        }).success(function (data, status, headers, config) {
          scope.devices = data;
        });
    };
};

function getPlaylistRefresh(scope, http) {
    return function () {
        http({
            method: 'GET',
            url: '/api/playlists'
        }).success(function (data, status, headers, config) {
            scope.playlists = data;
        });
    };
};

var refreshDevices, refreshPlaylists;

angular.module('upnpControllers', [])
    .controller('AppCtrl', ['$scope', '$http', function ($scope, $http) {
        if (!$scope.playlists) { 
            $scope.playlists = []
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
        $scope['addAlert'] = function addAlert(type, message) {
            $scope.alerts.push({ type: type, msg: message });
        };
        $scope['closeAlert'] = function(index) {
            $scope.alerts.splice(index, 1);
        };
        $scope['storePlaylist'] = function storePlaylist(playlistName) {
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
        $scope['appendPlaylist'] = function appendPlaylist(playlistName) {
            if (dsAppendPlaylist) {
                $http({
                    method: 'POST',
                    url: dsAppendPlaylist.href + playlistName
                })
                .success(function () {
                    $scope.addAlert('success', 'Track added');
                    refreshPlaylists();
                })
                .error(function (data, status, headers, config) {
                    $scope.addAlert('danger', 'Add Track Failed: ' + data + ' (' + status + ')');
                });
            }
        };
        $scope['playMusic'] = function playMusic(playlistName) {
            if (dsPlaymusic) {
                $http({
                    method: 'POST',
                    url: dsPlaymusic.href,
                    data: { playlistName: playlistName }
                });
            }
        }
        $scope['newSchedule'] = {
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
            time: ''
        };
        $scope['toggleDay'] = function toggleDay(dayOfWeek) {
            if ($scope['newSchedule'].days[dayOfWeek] !== void 0) {
                $scope['newSchedule'].days[dayOfWeek] = !$scope['newSchedule'].days[dayOfWeek];
            }
        };
        $scope['addWakeUp'] = function addWakeUp(newSchedule) {
            var result = _.findWhere($scope.device.links, { 'rel' : 'add-schedule' });
            var body = {
                days : newSchedule.days,
                time: newSchedule.time,
                action: newSchedule.action,
                playlistName: newSchedule.playlistName
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
        $scope['deleteWakeUp'] = function deleteWakeUp(schedule) {
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
        $scope['isExistingPlaylist'] = function isExistingPlaylist(playlistName) {
            return $scope.playlists.indexOf(playlistName) > -1;
        };
    }]);