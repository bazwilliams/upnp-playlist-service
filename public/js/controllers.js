'use strict';

/* Controllers */

angular.module('upnpApp', [])
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
	  }]);