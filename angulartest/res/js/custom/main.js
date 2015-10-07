var tweb = angular.module('tweb', ['ngRoute', 'ngAnimate']);

tweb.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'res/partials/home.html',
                    controller: 'home'
                }).
                when('/login', {
                    templateUrl: 'res/partials/login.html',
                    controller: 'login'
                }).
				when('/polls', {
                    templateUrl: 'res/partials/polls.html',
                    controller: 'polls'
                }).
				when('/join', {
                    templateUrl: 'res/partials/join.html',
                    controller: 'join'
                }).
                otherwise({
                    redirectTo: '/login'
                });
        }]);

tweb.controller('home', function($scope) {
	$scope.message = 'Page: home';
});

tweb.controller('login', function($scope, $http, $location) {
	$scope.login = function() {
		$http.post("test.txt", {"username":"luc", "password":"swagger"})
		.success(function(data, status, headers, config) {
			$scope.msg = data;
			$location.path("/polls");
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});

tweb.controller('polls', function($scope) {
	$scope.message = 'Page: polls';
});

tweb.controller('join', function($scope) {
	$scope.message = 'Page: join';
});
