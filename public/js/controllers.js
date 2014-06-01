'use strict';

/* Controllers */

angular.module('upnpControllers', [])
	.controller('AppCtrl', ['$scope', '$http', function ($scope, $http) {
	    $http({
	      method: 'GET',
	      url: '/api/devices'
	    }).
	    success(function (data, status, headers, config) {
	      $scope.devices = data;
	    }).
	    error(function (data, status, headers, config) {
	      $scope.name = 'Error!';
	    });
	}])
	.controller('DeviceCtrl', ['$scope', '$http', function ($scope, $http) {
		var dsStorePlaylist = _.findWhere($scope.device.links, { 'rel' : 'store-playlist' });
		$scope['storePlaylist'] = function (playlistName) {
			if (dsStorePlaylist) {
				$http({
					method: 'PUT',
					url: dsStorePlaylist.href + playlistName
				});
			}
		};
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
			time: ''
		};
		$scope['toggleDay'] = function (dayOfWeek) {
			if ($scope['newSchedule'].days[dayOfWeek] !== void 0) {
				$scope['newSchedule'].days[dayOfWeek] = !$scope['newSchedule'].days[dayOfWeek];
			}
		};
		$scope['addWakeUp'] = function (newSchedule) {
			var result = _.findWhere($scope.device.links, { 'rel' : 'add-wakeup' });
			var body = {
				days : newSchedule.days,
				time: newSchedule.time
			};
			$http({
				method: 'POST',
				url: result.href,
				data: body
			});
		};
		$scope['deleteWakeUp'] = function (schedule) {
			var result = _.findWhere(schedule.links, { 'rel' : 'delete' });
			if (result) {
				$http({
					method: 'DELETE',
					url: result.href
				});
			}
		};
	}]);