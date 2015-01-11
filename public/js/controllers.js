'use strict';

/* Controllers */

function getRefresh(scope, http) {
    return function () {
        if (!scope.playlists) { 
            scope.playlists = []
        }
        http({
            method: 'GET',
            url: '/api/devices'
        }).success(function (data, status, headers, config) {
          scope.devices = data;
        });
        http({
            method: 'GET',
            url: '/api/playlists'
        }).success(function (data, status, headers, config) {
            scope.playlists = data;
        });
    };
};

var refreshAll;

angular.module('upnpControllers', [])
    .controller('AppCtrl', ['$scope', '$http', function ($scope, $http) {
        refreshAll = getRefresh($scope, $http);
        refreshAll();
    }])
    .controller('DeviceCtrl', ['$scope', '$http', function ($scope, $http) {
        var dsStorePlaylist = _.findWhere($scope.device.links, { 'rel' : 'store-playlist' });
        var dsAppendPlaylist = _.findWhere($scope.device.links, { 'rel' : 'add-to-playlist' });
        var dsPlaymusic = _.findWhere($scope.device.links, { 'rel' : 'play-music' });
        $scope['storePlaylist'] = function storePlaylist(playlistName) {
            if (dsStorePlaylist) {
                $http({
                    method: 'PUT',
                    url: dsStorePlaylist.href + playlistName
                })
                .success(function () {
                    refreshAll();
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
                    refreshAll();
                });
            }
        };
        $scope['playMusic'] = function playMusic(playlistName) {
            if (dsPlaymusic) {
                $http({
                    method: 'POST',
                    url: dsPlaymusic.href,
                    data: { playlistName: playlistName }
                })
                .success(function () {
                    refreshAll();
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
                refreshAll();
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
                    refreshAll();
                });
            }
        };
        $scope['isExistingPlaylist'] = function isExistingPlaylist(playlistName) {
            return $scope.playlists.indexOf(playlistName) > -1;
        };
    }]);