var tweb = angular.module('tweb', ['ngRoute', 'ngAnimate']);

/*
This factory is used to store data that is shared accross controllers
*/
tweb.factory('UserDataFactory', function () {
    var userData = {
        session: null
    };
	
    return {
		getSession: function() {
			return userData.session;
		},
		setSession: function(pSession) {
			userData.session = pSession;
		}
	}
});

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
				when('/register', {
                    templateUrl: 'res/partials/register.html',
                    controller: 'register'
                }).
                otherwise({
                    redirectTo: '/login'
                });
        }]);

tweb.controller('home', function($scope) {
	$scope.message = 'Page: home';
});

tweb.controller('login', function($scope, $http, $location, UserDataFactory) {
	$scope.login = function() {

		var submittedEmail = $scope.user.email;
		var submittedPassword = $scope.user.password;

		$http.post("/testmongoose/account", {
			email: submittedEmail,
			password: submittedPassword
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				
				UserDataFactory.setSession(data.data);
				alert('Logged in. Redirecting');
				$location.path("/polls");
			} else {
				alert("Could not login: " + data.messages.join());
			}
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});

tweb.controller('polls', function($scope, UserDataFactory) {
	$scope.userSession = UserDataFactory.getSession();
});

tweb.controller('join', function($scope) {
	$scope.message = 'Page: join';
});

tweb.controller('register', function($scope, $http, $location, UserDataFactory) {
	$scope.register = function() {

		if (UserDataFactory.getSession() != null) {
			alert('You are already logged in');
		} else {
		
			var errors = [];
	
			var submittedFirstname = $scope.user.firstname;
			var submittedLastname = $scope.user.lastname;
			var submittedEmail = $scope.user.email;
			var submittedPassword1 = $scope.user.password1;
			var submittedPassword2 = $scope.user.password2;

			if (submittedPassword1 != submittedPassword2) {
				errors.push('Password do not match');
			}
			
			$http.put("/testmongoose/register", {
				email: submittedEmail,
				firstname: submittedFirstname,
				lastname: submittedLastname,
				password: submittedPassword1
			})
			.success(function(data, status, headers, config) {
				if (data.status == 'ok') {
					alert('Registered.');
					$location.path("/login");
				} else {
					alert("Could not register: " + data.messages.join());
				}
			}).error(function(data, status, headers, config) {
			});
		}
	};
});
