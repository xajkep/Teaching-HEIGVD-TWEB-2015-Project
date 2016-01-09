tweb.controller('register', function($window, $scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	
	$scope.registerUsingGitHub = function() {
		$window.location.href = "/api/v1/callbacks/redirect_github";
	};
	
	$scope.registerUsingFacebook = function() {
		$window.location.href = "/api/v1/callbacks/redirect_facebook";
	};
	
	$scope.user = {
		'firstname': '',
		'lastname': '',
		'email': '',
		'password1': '',
		'password2': ''
	};
	
	$scope.register = function() {

		if (UserDataFactory.getSession() != null) {
			Lobibox.alert(
				'error',
				{
					"msg": 'You are already logged in'
				}
			);
		} else {
		
			var errors = [];
	
			var submittedFirstname = $scope.user.firstname;
			var submittedLastname = $scope.user.lastname;
			var submittedEmail = $scope.user.email;
			var submittedPassword1 = $scope.user.password1;
			var submittedPassword2 = $scope.user.password2;

			if (submittedPassword1 != submittedPassword2) {
				errors.push('Passwords do not match');
			}

			if (errors.length == 0) {
				$http.post("/api/v1/registerForm", {
					email: submittedEmail,
					firstname: submittedFirstname,
					lastname: submittedLastname,
					password: submittedPassword1
				})
				.success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						Lobibox.alert(
							'success',
							{
								"msg": "Account created. You will be redirected to the login page"
							}
						);

						$location.path("/login");
					} else {
						Lobibox.alert(
							'error',
							{
								"msg": "Could not register:\n" + DisplayErrorMessagesFromAPI(data.messages, "<br />")
							}
						);
					}
				}).error(function(data, status, headers, config) {
				});
			} else {
				Lobibox.alert(
					'error',
					{
						"msg": errors.join("<br />")
					}
				);
			}
		}
	};
});