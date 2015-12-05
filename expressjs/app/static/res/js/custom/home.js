tweb.controller('home', function($scope, $http) {
	$scope.usersCount = 0;
	$scope.pollsCount = 0;
	$scope.openPollsCount = 0;

	$scope.$on('$viewContentLoaded', function() {
		// Retrieving the stats from the REST API
		$http({
			method: 'GET',
			url: "/api/v1/stats/",
			cache: false
		})
		.success(function(data, status, headers, config) {
			$scope.usersCount = data.usersCount;
			$scope.pollsCount = data.pollsCount;
			$scope.openPollsCount = data.openPollsCount;
		}).error(function(data, status, headers, config) {
			alert("Could not retrieve stats: http error");
		});
	});
});