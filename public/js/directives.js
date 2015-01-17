(function() {
    "use strict";
	angular.module('upnpDirectives', [])
		.directive('ngKeySelect', function () {
		    return function (scope, element, attrs) {
		        element.bind("keydown keypress", function (event) {
		            if(event.which === 13 || event.which === 32) {
		                scope.$apply(function (){
		                    scope.$eval(attrs.ngKeySelect);
		                });
		                event.preventDefault();
		            }
		        });
		    };
		});
}());