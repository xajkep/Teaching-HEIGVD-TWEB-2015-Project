tweb.controller('pollaudience', function($scope, $location, $interval, UserDataFactory, ServerPushPoll, DisplayErrorMessagesFromAPI) {
	$scope.userSession = UserDataFactory.getSession();

	// The poll id is a GET parameter
	var pollId = $location.search().id;
	
	$scope.pollName = '';
	$scope.currentQuestion = {};
	$scope.displayQuestion = false;
	$scope.votingIsAllowed = false;
	$scope.voteRegistered = false;
	$scope.voteCountOnThisQuestion = 0;
	$scope.votingAsAnonymousIsAllowed = false;
	var timerHdl;
	
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
	
	$scope.$on("$destroy", function(){
        $scope.stopTimer();
		ServerPushPoll.disconnect();
    });

	$scope.vote = function(answerIndex, voteAsAnonymous) {
		$scope.currentQuestion.answers[answerIndex].voted = true;
		ServerPushPoll.vote(answerIndex, voteAsAnonymous);
	}
	
	var redirectToPolls = function() {
		ServerPushPoll.disconnect();
		
		Lobibox.alert(
			'success',
			{
				"msg": "Thank you for your participation."
			}
		);
		
		$location.path("/polls");
	};
	
	ServerPushPoll.registerBasicPollEvents(function() {
												// When the same user already has a connection for the same poll 
												$scope.votingIsAllo
												wed = false;
												$scope.$apply();
												
												Lobibox.alert(
													'error',
													{
														"msg": 'This session has been terminated because you joined the same poll again.'
													}
												);
											},
											function(pollDetails) {
												// Poll details
												$scope.$apply(function() {
													$scope.pollName = pollDetails.name;
												});
											}, function(question) {
												// Next question (is also used as a catchUp)
											   var nextQuestion = question.question;
											   var timeout = question.timeout;
		
											   $scope.timerRemaining = timeout;
											   $scope.voteCountOnThisQuestion = question.voted;
		
											   if (timeout > 0) {
													$scope.startTimer();
													$scope.votingIsAllowed = $scope.voteCountOnThisQuestion < nextQuestion.maxVote;
													$scope.votingAsAnonymousIsAllowed = nextQuestion.allowAnonymous;
													
													swal({
													  "title": "You can vote!",
													  "text": "<strong>A new question is displayed.</strong>",
													  "timer": 1500,
													  "html": true,
													  "showConfirmButton": false
													});
											   } else {
												   $scope.votingIsAllowed = false;
											   }

											   $scope.voteRegistered = false;
											   $scope.currentQuestion = nextQuestion;
											   $scope.displayQuestion = true;
											   $scope.$apply();
										   },
										   function() {
											   // Poll completed
											   $scope.stopTimer();
											   $scope.votingIsAllowed = false;

											   redirectToPolls();
											   
											   $scope.$apply();
										   },
										   function() {
											   // Question timeout
											   $scope.stopTimer();
											   $scope.votingIsAllowed = false;
											   $scope.$apply();
										   },
										   function(voteResult) {
											   // Vote result
											   if (voteResult.status == 'ok') {
												   $scope.voteCountOnThisQuestion = $scope.voteCountOnThisQuestion + 1;
												   $scope.voteRegistered = true;
												   
												   
												   if ($scope.voteCountOnThisQuestion >= $scope.currentQuestion.maxVote) {
													   $scope.votingIsAllowed = false;
												   }
												   
												   $scope.$apply();
											   }
										   });
										   
	ServerPushPoll.catchUp();
});