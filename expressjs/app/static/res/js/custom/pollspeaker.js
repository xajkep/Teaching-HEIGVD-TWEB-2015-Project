tweb.controller('pollspeaker', function($scope, $location, $interval, UserDataFactory, ServerPushPoll) {
	$scope.userSession = UserDataFactory.getSession();
	$scope.userEmail = UserDataFactory.getEmail();
	
	// The poll id is a GET parameter
	var pollId = $location.search().id;
	
	// Poll name
	$scope.pollName = '';
	
	// Position in the poll
	$scope.currentQuestionNumber = 0;
	
	// Number of questions in the poll
	$scope.totalQuestions = 0;
	
	$scope.connected = ServerPushPoll.connectedUsers;
	$scope.currentQuestion = {};
	$scope.displayQuestion = false;
	$scope.votingIsAllowed = false;
	$scope.goNextQuestionAllowed = true;
	$scope.hasPollEnded = false;
	$scope.timerRemaining = 0;
	$scope.votingAsAnonymousIsAllowed = false;
	$scope.totalVotesCount = 0;
	
	var timerHdl;
	
	// This is the activity graph
	var chartVotingActivity;
	var chartVotingActivityData = [
			{
				label: 'Votes',
				strokeColor: '#A31515',
				data: [{
					x: 0,
					y: 0
				}]
			}];
	
	$scope.startTimer = function() {
		timerHdl = $interval(function() {
									 $scope.timerRemaining = $scope.timerRemaining - 1;

									 if ($scope.timerRemaining <= 0) {
										 $scope.stopTimer();
									 }
								 }, 1000);
	};
	
	$scope.stopTimer = function() {
		if (angular.isDefined(timerHdl)) {
			$interval.cancel(timerHdl);
			timerHdl = undefined;
		}
	};
	
	$scope.goNextQuestion = function() {
		$scope.goNextQuestionAllowed = false;
		ServerPushPoll.goNextQuestion();
	};
	
	$scope.viewPollResults = function() {
		$location.path("/pollview").search({ 'id': pollId });
	};

	$scope.labels = [];
	$scope.data = [];
	$scope.options = { animationSteps: 20 };

	ServerPushPoll.registerEventsWhenPeopleConnectAndDisconnect(function(newConnectedList) {
																	// One user joined
																	$scope.connected = newConnectedList;
																	$scope.$apply();
															    },
																// Workaround. Even $apply doesn't work. Enjoy.
																function(newConnectedList) {
																	// One user disconnected
																	$scope.connected = newConnectedList;
																	$scope.$apply();
																},
																function(newConnectedList) {
																	// When the speaker joins, the list of already connected is received
																	$scope.connected = newConnectedList;
																	$scope.$apply();
																});
																

	ServerPushPoll.registerBasicPollEvents(function() {
												// Never happens for the speaker
											},
											function(pollDetails) {
												$scope.$apply(function() {
													$scope.pollName = pollDetails.name;
												});
											}, function(question) {
		
											   // question.voted is unused
											   var nextQuestion = question.question;
											   var timeout = question.timeout;
		
											   $scope.timerRemaining = timeout;
											   
											   if (timeout > 0) {
													$scope.startTimer();
													$scope.currentQuestionNumber = question.current;
													$scope.totalQuestions = question.total;
													
													// Next question
													$scope.votingIsAllowed = true;
													$scope.votingAsAnonymousIsAllowed = nextQuestion.allowAnonymous;
													$scope.goNextQuestionAllowed = false;
											   }

											   var graphLabels = [];
											   var graphValues = [];
											   var answersCount = nextQuestion.answers.length;
											   for (var i = 0; i < answersCount; i++) {
												   nextQuestion.answers[i].count = 0;
												   graphLabels.push(nextQuestion.answers[i].name);
												   graphValues.push(0);
											   }

											   $scope.labels = graphLabels;
											   $scope.data = graphValues;
											   
											   $scope.currentQuestion = nextQuestion;
											   $scope.displayQuestion = true;

											   $scope.totalVotesCount = 0;
											   $scope.createPartitipationGraph();
											   
											   $scope.$apply();
										   },
										   function() {
											   // Poll completed
											   $scope.hasPollEnded = true;
											   $scope.votingIsAllowed = false;
											   $scope.goNextQuestionAllowed = false;
											   $scope.stopTimer();
											   $scope.$apply();
											   
											   ServerPushPoll.disconnect();
										   },
										   function() {
											   // Question timeout
											   $scope.votingIsAllowed = false;
											   $scope.goNextQuestionAllowed = true;
											   $scope.stopTimer();
											   $scope.$apply();
										   },
										   function(voteResult) {
											   // Vote result
											   // Do nothing. The speaker cannot vote.
										   });

	ServerPushPoll.registerLiveVoteResults(function(results) {
											   var timing = results.timing;
											   var resultsCount = results.results.length;
											   var graphValues = [];
											   for (var i = 0; i < resultsCount; i++) {
												   var count = results.results[i].count;
												   $scope.currentQuestion.answers[i].count = count;
												   graphValues.push(count);
											   }
											   
											   $scope.data = graphValues;
											  
											   
											   $scope.totalVotesCount = $scope.totalVotesCount + 1;
											   
											   // null when catching up
											   if (timing != null) {
												   chartVotingActivity.datasets[0].addPoint(timing, $scope.totalVotesCount);
												   chartVotingActivity.update();
											   }
											   
											   $scope.$apply();
										   });
										   
	// This will include the partitipation graph in the poll. This graph has no Angular binding
	$scope.createPartitipationGraph = function() {
		var ctx3 = document.getElementById("votingactivity").getContext("2d");
		chartVotingActivity = new Chart(ctx3).Scatter(chartVotingActivityData, {
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
	
	$scope.$on('$viewContentLoaded', function() {
		$scope.createPartitipationGraph();

		ServerPushPoll.catchUp();
	});
	
	$scope.$on("$destroy", function(){
        $scope.stopTimer();
		ServerPushPoll.disconnect();
    });
});