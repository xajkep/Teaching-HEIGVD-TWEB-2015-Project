tweb.controller('login', function($window, $scope, $http, $location, $cookies, UserDataFactory, DisplayErrorMessagesFromAPI) {

	$scope.loginWithGitHub = function() {
		$window.location.href = "/api/v1/callbacks/redirect_github";
	};
	
	$scope.loginWithFacebook = function() {
		$window.location.href = "/api/v1/callbacks/redirect_facebook";
	};

	// Are we coming from an SSO ? (like GitHub). If so, retrieving parameters from the URL
	$scope.$on('$viewContentLoaded', function() {
		var sessionByCookie = $cookies.get('session');
		var emailByCookie = $cookies.get('email');

		if (typeof sessionByCookie !== 'undefined' && typeof emailByCookie !== 'undefined') {
			UserDataFactory.setSession(sessionByCookie);
			UserDataFactory.setEmail(emailByCookie);

			$cookies.remove('session', { 'path': '/' });
			$cookies.remove('email', { 'path': '/' });
			
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
				Lobibox.alert(
					'error',
					{
						"msg": "Could not login: " + DisplayErrorMessagesFromAPI(data.messages, "<br />")
					}
				);
			}
		}).error(function(data, status, headers, config) {
			Lobibox.alert(
				'error',
				{
					"msg": "Could not login: http error"
				}
			);
		});
	};
});