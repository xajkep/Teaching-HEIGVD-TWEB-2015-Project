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

tweb.controller('login', function($scope) {
	$scope.message = 'Page: login';
});

tweb.controller('polls', function($scope) {
	$scope.message = 'Page: polls';
});

tweb.controller('join', function($scope) {
	$scope.message = 'Page: join';
});
