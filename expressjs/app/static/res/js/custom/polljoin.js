tweb.controller('polljoin', function($scope, $location, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();
	var pollIdToJoin = $location.search().id;

	socketIOConnectToServer(ServerPushPoll,
	                        UserDataFactory.getSession(),
	                        pollIdToJoin,
							function() {
							   $location.path("/pollspeaker").search({ 'id': pollIdToJoin });
							   $scope.$apply();
						   }, function() {
								$location.path("/pollaudience").search({ 'id': pollIdToJoin });
								$scope.$apply();
						   }
	);
	
});