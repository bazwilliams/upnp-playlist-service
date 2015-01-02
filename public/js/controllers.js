'use strict';

/* Controllers */

var getRefresh = function (scope, http) {
    return function () {
        http({
          method: 'GET',
          url: '/api/devices'
        }).
        success(function (data, status, headers, config) {
          scope.devices = data;
        });
    }
};

var refreshAll;

angular.module('upnpControllers', [])
	.controller('AppCtrl', ['$scope', '$http', function ($scope, $http) {
        refreshAll = getRefresh($scope, $http);
        refreshAll();
	}])
	.controller('DeviceCtrl', ['$scope', '$http', function ($scope, $http) {
		var dsStorePlaylist = _.findWhere($scope.device.links, { 'rel' : 'store-playlist' });
		var dsReplacePlaylist = _.findWhere($scope.device.links, { 'rel' : 'replace-playlist' });
		$scope['storePlaylist'] = function (playlistName) {
			if (dsStorePlaylist) {
				$http({
					method: 'PUT',
					url: dsStorePlaylist.href + playlistName
				});
			}
		};
		$scope['replacePlaylist'] = function(playlistName) {
			if (dsReplacePlaylist) {
				$http({
					method: 'POST',
					url: dsReplacePlaylist.href,
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
			action: 'wake',
			time: ''
		};
		$scope['toggleDay'] = function (dayOfWeek) {
			if ($scope['newSchedule'].days[dayOfWeek] !== void 0) {
				$scope['newSchedule'].days[dayOfWeek] = !$scope['newSchedule'].days[dayOfWeek];
			}
		};
		$scope['addWakeUp'] = function (newSchedule) {
			var result = _.findWhere($scope.device.links, { 'rel' : 'add-schedule' });
			var body = {
				days : newSchedule.days,
				time: newSchedule.time,
				action: newSchedule.action
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
		$scope['deleteWakeUp'] = function (schedule) {
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
	}]);