'use strict';

/* Controllers */

angular.module('upnpControllers', [])
	.controller('DsCtrl', ['$scope', '$http', function ($scope, $http) {
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
	.controller('DsDeleteWakeUpCtrl', ['$scope', '$http', function ($scope, $http) {
		var result = _.findWhere($scope.schedule.links, { 'rel' : 'delete' });
		$scope['delete'] = function () {
			if (result) {
				$http({
					method: 'DELETE',
					url: result.href
				});
			}
		};
	}])
	.controller('DsStorePlaylistCtrl', ['$scope', '$http', function ($scope, $http) {
		var result = _.findWhere($scope.device.links, { 'rel' : 'store-playlist' });
		$scope['storePlaylist'] = function (playlistName) {
			if (result) {
				$http({
					method: 'PUT',
					url: result.href + playlistName
				});
			}
		};
		$scope['addWakeUp'] = function (mon,tue,wed,thu,fri,sat,sun,time) {
		var result = _.findWhere($scope.device.links, { 'rel' : 'add-wakeup' });
			if (time && time.split(':').length === 2) {
				var body = {
					days : {
						'mon' : mon ? true : false,
						'tue' : tue ? true : false,
						'wed' : wed ? true : false,
						'thu' : thu ? true : false,
						'fri' : fri ? true : false,
						'sat' : sat ? true : false,
						'sun' : sun ? true : false
					},
					hour: time.split(':')[0],
					minute: time.split(':')[1]
				};
				$http({
					method: 'POST',
					url: result.href,
					data: body
				});
			}
		}
	}]);