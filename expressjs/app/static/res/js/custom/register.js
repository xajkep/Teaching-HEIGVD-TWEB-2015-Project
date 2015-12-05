tweb.controller('register', function($scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	
	$scope.user = {
		'firstname': '',
		'lastname': '',
		'email': '',
		'password1': '',
		'password2': ''
	};
	
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
						alert('Registered.');
						$location.path("/login");
					} else {
						alert("Could not register:\n" + DisplayErrorMessagesFromAPI(data.messages));
					}
				}).error(function(data, status, headers, config) {
				});
			} else {
				alert(errors.join());
			}
		}
	};
});