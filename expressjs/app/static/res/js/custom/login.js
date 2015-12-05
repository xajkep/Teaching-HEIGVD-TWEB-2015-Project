tweb.controller('login', function($scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	// DEBUG TO-DO
	$scope.user = {
		'email': 'test@test.com',
		'password': 'TestTest1991'
	};
	
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
				$location.path("/polls");
			} else {
				alert("Could not login: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			$scope.msg2 = data;
		});
	};
});