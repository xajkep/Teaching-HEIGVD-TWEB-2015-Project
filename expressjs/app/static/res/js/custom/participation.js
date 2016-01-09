
tweb.controller('participation', function($scope, $http, $location, UserDataFactory, ServerPushPoll, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();
	$scope.userEmail = UserDataFactory.getEmail();

	var retrievePolls = function() {
		$http({
			method: 'GET',
			url: "/api/v1/participations",
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				$scope.polls = data.data.polls;
			} else {
				Lobibox.alert(
					'error',
					{
						"msg": "Could not retrieve participations: " + DisplayErrorMessagesFromAPI(data.messages)
					}
				);
			}
		}).error(function(data, status, headers, config) {
			Lobibox.alert(
				'error',
				{
					"msg": "Could not retrieve participations: http error"
				}
			);
		});

		$scope.$watch('searchText', function (val) {
			if (val != '' && val != undefined && val.length >= 3){
				$http({
					method: 'GET',
					url: "/api/v1/participations/" + val,
					cache: false,
					headers: {
						'Authorization': $scope.userSession
					}
				})
				.success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						$scope.search.users = data.data;
					} else {
						Lobibox.alert(
							'error',
							{
								"msg": "Could not retrieve polls by name: " + DisplayErrorMessagesFromAPI(data.messages, "<br />")
							}
						);
					}
				}).error(function(data, status, headers, config) {
					Lobibox.alert(
						'error',
						{
							"msg": "Could not retrieve polls by name: http error"
						}
					);
				});
			} else {
				$scope.search.users = [];
			}
		});
	};
	
	$scope.viewPollResults = function(pollId) {
		$location.path("/pollview").search({ 'id': pollId });
	};
	
	$scope.goBack = function(pollId) {
		$location.path("/polls");
	};
	
	$scope.joinPoll = function(pollIdToJoin) {
		socketIOConnectToServer(ServerPushPoll, UserDataFactory.getSession(), pollIdToJoin,
							function() {
							   $location.path("/pollspeaker");
							   $scope.$apply();
						   }, function() {
								$location.path("/pollaudience");
								$scope.$apply();
						   });
	};

	// User's polls
	$scope.polls = [];
	
	// Search by email results
	$scope.search = {
		users: []
	};

	if (UserDataFactory.getSession() == null) {
		Lobibox.alert(
			'error',
			{
				"msg": "Please login first"
			}
		);
		
		$location.path("login");
	} else {
		retrievePolls();
	}
});