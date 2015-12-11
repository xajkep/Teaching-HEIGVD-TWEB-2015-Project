tweb.controller('login', function($window, $scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	// DEBUG TO-DO
	$scope.user = {
		'email': 'test@test.com',
		'password': 'TestTest1991'
	};
	
	$scope.loginWithGitHub = function() {
		$window.location.href = "/api/v1/callbacks/redirect_github";
	};
	
	$scope.loginWithFacebook = function() {
		$window.location.href = "/api/v1/callbacks/redirect_facebook";
	};

	// Are we coming from an SSO ? (like GitHub). If so, retrieving parameters from the URL
	$scope.$on('$viewContentLoaded', function() {
		var session = $location.search().session;
		var email = $location.search().email;

		if (typeof session !== 'undefined' && typeof email !== 'undefined') {
			UserDataFactory.setSession(session);
			UserDataFactory.setEmail(email);
			
			// Important: clearing parameters (otherwise they are kept from controller to controller)
			$location.search('session', null);
			$location.search('email', null);
			
			$location.path("/polls");
		}
	});
	
	$scope.login = function() {
		var submittedEmail = $scope.user.email;
		var submittedPassword = $scope.user.password;

		$http.post("/api/v1/account", {
			email: submittedEmail,
			password: submittedPassword
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				// We store the session in the factory, so other controllers can access later it as well
				UserDataFactory.setSession(data.data.session);
				UserDataFactory.setEmail(submittedEmail);
				$location.path("/polls");
			} else {
				alert("Could not login: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});