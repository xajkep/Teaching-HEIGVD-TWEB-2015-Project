tweb.controller('headcontroller', function($scope) {
	
	$scope.layouts =  [
	{
		"name": "Default",
		"url": "default"
	},
	{
		"name": "White",
		"url": "cerulean"
	},
	{
		"name": "Black",
		"url": "slate"
	}];
	
	$scope.layout = $scope.layouts[0];
});