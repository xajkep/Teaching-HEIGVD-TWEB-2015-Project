
tweb.controller('polls', function($scope, $http, $location, UserDataFactory, ServerPushPoll, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();
	$scope.userEmail = UserDataFactory.getEmail();

	$scope.logout = function() {
		$location.path("/login");
	};
	
	$scope.createPoll = function() {
		$location.path("/polldetails").search('mode', 'new');
	};
	
	$scope.deletePoll = function(pollId) {
		// Requesting the server to delete the poll
		$http({
				method: 'DELETE',
				url: "/api/v1/poll/" + pollId,
				cache: false,
				headers: {
					'Authorization': $scope.userSession
				}
			})
			.success(function(data, status, headers, config) {
				if (data.status == 'ok') {
					
					// Removing the poll from the displayed polls.
					// This saves a request to the server to get the user's poll
					// Warning, delete $scope.polls[i] does not work and breaks the binding!
					var polls = [];
					
					for (var i = 0; i < $scope.polls.length; i++) {
						var currentPoll = $scope.polls[i];
						
						if (currentPoll._id != pollId) {
							polls.push(currentPoll);
						}
					}
					
					$scope.polls = polls;
				
				} else {
					alert("Could not delete poll: " + DisplayErrorMessagesFromAPI(data.messages));
				}
			}).error(function(data, status, headers, config) {
				alert("Could not delete poll: http error");
			});
	};
	
	$scope.viewPollResults = function(pollId) {
		$location.path("/pollview").search({ 'id': pollId });
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
	
	$scope.openPoll = function(pollId) {
		$http({
			method: 'POST',
			url: "/api/v1/poll/opened/" + pollId,
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				$location.path("/polljoin").search({ 'id': pollId });
			} else {
				alert("Could not open poll: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			alert("Could not open poll: http error");
		});
	};
	
	$scope.editPoll = function(pollId) {
		$location.path("/polldetails").search('mode', 'edit').search('id', pollId);
	}
	
	// User's polls
	$scope.polls = [];
	
	// Search by email results
	$scope.search = {
		users: []
	};
	
	if (UserDataFactory.getSession() == null) {
		alert("Please login first");
		$location.path("login");
	} else {
		$http({
			method: 'GET',
			url: "/api/v1/polls",
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				$scope.polls = data.data;
			} else {
				alert("Could not retrieve polls: " + DisplayErrorMessagesFromAPI(data.messages));
			}
		}).error(function(data, status, headers, config) {
			alert("Could not retrieve polls: http error");
		});

		$scope.$watch('searchText', function (val) {
			if (val != '' && val != undefined && val.length >= 3){
				$http({
					method: 'GET',
					url: "/api/v1/users/email/" + val,
					cache: false,
					headers: {
						'Authorization': $scope.userSession
					}
				})
				.success(function(data, status, headers, config) {
					if (data.status == 'ok') {
						$scope.search.users = data.data;
					} else {
						alert("Could not retrieve users by email: " + DisplayErrorMessagesFromAPI(data.messages));
					}
				}).error(function(data, status, headers, config) {
					alert("Could not retrieve users by email: http error");
				});
			} else {
				$scope.search.users = [];
			}
		});
	}
});