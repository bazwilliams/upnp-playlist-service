(function() {
    "use strict";
    var refreshDevices, refreshPlaylists;
    function updateDeviceSources(scope, http) {
        _.each(scope.devices, function(device) {
            var dsRadioChannelist = _.findWhere(device.links, { 'rel' : 'radio-stations' });
            if (dsRadioChannelist) {
                device.whatCanPlay = [];
                http({
                    method: 'GET',
                    url: dsRadioChannelist.href
                }).success(function (data, status, headers, config) {
                    var playlistSource = 
                        _.findWhere(device.sources, { 'type' : 'Playlist' }) ||
                        _.findWhere(device.sources, { 'type' : 'PlayList' });
                    var radioSource = _.findWhere(device.sources, { 'type' : 'Radio' });
                    device.whatCanPlay = [];
                    _.each(device.sources, function (source, index) {
                        device.whatCanPlay.push({
                            index: source.index,
                            sourceName: source.name,
                            playlistName: '',
                            radioChannel: {}
                        });
                    });
                    if (playlistSource && scope.playlists) {
                        _.each(scope.playlists, function (playlistName) {
                            device.whatCanPlay.push({
                                index: playlistSource.index,
                                sourceName: playlistSource.name + ': ' + playlistName,
                                playlistName: playlistName,
                                radioChannel: {}
                            });
                        });
                    }
                    if (radioSource && data) {
                        _.each(data, function (channel) {
                            device.whatCanPlay.push({
                                index: radioSource.index,
                                sourceName: radioSource.name + ': ' + channel.title,
                                playlistName: '',
                                radioChannel: {
                                    id: channel.id,
                                    uri: channel.uri
                                }
                            });
                        });
                    }
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
                updateDeviceSources(scope, http);
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
                updateDeviceSources(scope, http);
            });
        };
    }
    angular.module('upnpControllers', [])
        .controller('ConfigCtrl', ['$scope', '$http', function ($scope, $http) {
            $http({
                method: 'GET',
                url: '/api/configuration'
            }).success(function (data, status, headers, config) {
                $scope.configuration = data;
            });
            $scope.storeConfiguration = function storeConfiguration() {
                $http({
                    method: 'PUT',
                    url: '/api/configuration',
                    data: $scope.configuration
                });
            };
        }])
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
                }, 4000);
            };
            $scope.closeAlert = function(index) {
                $scope.alerts.splice(index, 1);
                $scope.$apply();
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
                action: $scope.device.whatCanPlay.length ? 'wake' : 'sleep',
                sourceName: $scope.device.whatCanPlay.length ? $scope.device.whatCanPlay[0].sourceName : void 0,
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
                    playlistName: selectedSource && newSchedule.action === "wake" ? selectedSource.playlistName : void 0,
                    sourceId: selectedSource && newSchedule.action === "wake" ? selectedSource.index : void 0,
                    radioChannel: selectedSource && newSchedule.action === "wake" ? selectedSource.radioChannel : void 0
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