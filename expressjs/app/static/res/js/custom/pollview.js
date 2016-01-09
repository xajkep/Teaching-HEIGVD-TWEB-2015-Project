tweb.controller('pollview', function($scope, $http, $location, $timeout, UserDataFactory, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();
	
	var pollId = $location.search().id;
	
	$scope.graphOptions = { animationSteps: 40 };
	
	$scope.goBack = function() {
		$location.path("/polls");
	};
	
	// Including the participation graph for each question. This graph has no Angular binding
	$scope.createPartitipationGraph = function(element, data) {
		var ctx3 = document.getElementById(element).getContext("2d");
		var chartVotingActivity = new Chart(ctx3).Scatter(data, {
			bezierCurve: false,
			showTooltips: false,
			scaleShowHorizontalLines: true,
			scaleShowLabels: false,
			scaleBeginAtZero : true,
			scaleType: "number",
			scaleShowVerticalLines: false,
			scaleLabel: "<%=value%> votes"
		});
	};

	var poll = {
		name: '',
		questions: []
	}; 

	$scope.$on('$viewContentLoaded', function() {
		// Retrieving poll stats
		$http({
			method: 'GET',
			url: "/api/v1/poll/" + pollId,
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (data.status == 'ok') {
				var poll = data.data;

				// Building data for plotting
				var questionsCount = poll.questions.length;
				for (var i=0; i<questionsCount;i++) {
					var graphLabels = [];
					var graphValues = [];
					var currentQuestion = poll.questions[i];							
					
					
					var allTimings = [];

					var answersCount = currentQuestion.answers.length;
					for (var y=0; y<answersCount;y++) {
						var currentAnswer = currentQuestion.answers[y];
						var anonymousAnswersCount = 0;
						var distinctUsersIds = [];
						var distinctUsers = [];
						
						graphLabels.push(currentAnswer.name);
						graphValues.push(currentAnswer.users.length);
						
						for (var k=0;k<currentAnswer.users.length;k++) {
							var currentUser = currentAnswer.users[k];
							
							allTimings.push(currentUser.timing);
							
							if (currentUser.anonymous) {
								anonymousAnswersCount = anonymousAnswersCount + 1;
							} else {
								var userId = currentUser.user._id;
								
								if (distinctUsersIds.indexOf(userId) < 0) {
									currentUser.user.voted = 1;
									
									distinctUsersIds.push(userId);
									distinctUsers.push(currentUser.user);
								} else {
									for (var z=0;z<distinctUsers.length;z++) {
										if (distinctUsers[z]._id == userId) {
											distinctUsers[z].voted++;
										}
									}
								}
							}
						}

						currentAnswer.anonymousAnswersCount = anonymousAnswersCount;
						currentAnswer.distinctUsers = distinctUsers;
					}
					
					// Sorting timings so the graph can be plotted correctly
					allTimings.sort(function(a, b) {
										return a - b;
									});
					
					var votesCount = 0;
					var chartVotingActivityOnlyData = [];
					
					chartVotingActivityOnlyData.push({'x': 0, 'y': 0 });
					
					for (var participation = 0; participation < allTimings.length; participation++) {
						votesCount = votesCount + 1;
						chartVotingActivityOnlyData.push({'x': allTimings[participation], 'y': votesCount });
					}

					currentQuestion.chartVotingActivityData = [
																{
																	'label': 'Votes',
																	'strokeColor': '#A31515',
																	'data': chartVotingActivityOnlyData
																}];
	
					currentQuestion.graph = {
						'labels': graphLabels,
						'values': graphValues
					};
				}

				$scope.poll = poll;
				
				// For each question, creating the participation graph. This is done as soon as the view loads
				$timeout(function () {
					for (var i=0;i<$scope.poll.questions.length;i++) {
						$scope.createPartitipationGraph('participationchart' + i, $scope.poll.questions[i].chartVotingActivityData);
					}
				});
			} else {
				Lobibox.alert(
					'error',
					{
						"msg": "Could not retrieve poll: " + DisplayErrorMessagesFromAPI(data.messages, "<br />")
					}
				);
			}
		}).error(function(data, status, headers, config) {
			Lobibox.alert(
					'error',
					{
						"msg": "Could not retrieve poll: http error"
					}
				);
		});
	});

});