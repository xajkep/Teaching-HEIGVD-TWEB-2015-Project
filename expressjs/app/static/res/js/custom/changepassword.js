
tweb.controller('changepassword', function($scope, $http, $location, UserDataFactory, DisplayErrorMessagesFromAPI) {
	
	$scope.user = {
		'newpassword1': '',
		'newpassword2': ''
	};
	
	$scope.changePassword = function() {

		var userSession = UserDataFactory.getSession();
	
		if (userSession == null) {
			alert("Please login first");
			$location.path("login");
		} else {
			var errors = [];

			var submittedPassword1 = $scope.user.newpassword1;
			var submittedPassword2 = $scope.user.newpassword2;

			if (submittedPassword1 != submittedPassword2) {
				errors.push('Passwords do not match');
			}
			
			$scope.user = {
				'newpassword1': '',
				'newpassword2': ''
			};

			if (errors.length == 0) {
				// Sending the request to update the password
				$http({
						method: 'PUT',
						url: "/api/v1/account/password",
						data: { 'password': submittedPassword1 },
						cache: false,
						headers: {
							'Authorization': userSession
						}
				}).success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						Lobibox.alert(
							'success',
							{
								"msg": "Password changed."
							}
						);
					} else {
						Lobibox.alert(
							'error',
							{
								"msg": "Could not change password: " + DisplayErrorMessagesFromAPI(data.messages, "<br />")
							}
						);
					}
				}).error(function(data, status, headers, config) {
					Lobibox.alert(
							'error',
							{
								"msg": "Could not change password: http error"
							}
						);
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