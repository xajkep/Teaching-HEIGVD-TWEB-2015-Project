var _ = require('underscore'), copilot = require('api-copilot');

// Will holt the session of the current user
var currentSessionIdUser1;

// Will contain the generated poll id
var pollId1;

// Will contain the app's stats just before the test scenario is executed
var initialStats;

// Poll to create
var pollToCreate1 = {
  'name': "Poll test 1",
  'questions':[{
	'name': "What is the coolest animal ?",
	'allowAnonymous': false,
	'maxVote': 5,
	'timeout': 45,
	'answers': [{
	  'name': "The cat"
	},{
	  'name': "The dog"
	}]
  },{
	'name': "What is the sweetest ?",
	'allowAnonymous': false,
	'maxVote': 5,
	'timeout': 45,
	'answers': [{
	  'name': "paper"
	},{
	  'name': "silk"
	},{
	  'name': "hamster wool"
	}]
  }]
};

// New poll data
var pollToCreate2 = {
  'name': "Poll test 2",
  'questions':[{
	'name': "Who is the best?",
	'allowAnonymous': true,
	'maxVote': 1,
	'timeout': 30,
	'answers': [{
	  'name': "I am"
	},{
	  'name': "You are"
	}]
  }]
};

var scenario = new copilot.Scenario({
	name: 'Premier Scenario',
	summary: 'peupler l\'API avec des données',
	baseUrl: 'http://127.0.0.1:8080/api/v1/',
	defaultRequestOptions: {
		json: true
	}
});

// Getting initial app stats.
// This will allow us to compare it to the stats retrieved at the end of the test procedure
// Changed introduced with this testing procedure should be seen in the final stats
scenario.step('getting initial stats', function() {
	return this.get({
		url: 'stats',
		expect: {statusCode: 200}
	});
});

// Checking the stats response for sanity and storing it for later use
scenario.step('storing and checking initial stats', function(response) {
	
	if (!response.body.hasOwnProperty('usersCount')) {
		return this.fail('No usersCount attribute in response');
	}

	if (!response.body.hasOwnProperty('pollsCount')) {
		return this.fail('No pollsCount attribute in response');
	}
	
	if (!response.body.hasOwnProperty('openPollsCount')) {
		return this.fail('No openPollsCount attribute in response');
	}
	
	initialStats = response.body;
});

// The next three tests will register 3 new users
scenario.step('register the first user', function(response) {
	return this.post({
	url: 'register',
	body: {
		firstname: 'User1',
		lastname: 'Ln1',
		email: 'asdf@asdf.asdf',
		password: 'ehVZdHH6'
	},
	expect: {statusCode: 200}
	});
});

scenario.step('register the second user', function(response) {
	return this.post({
	url: 'register',
	body: {
		firstname: 'User2',
		lastname: 'Ln2',
		email: 'sdfg@asdf.asdf',
		password: 'FRQAXk6o'
	},
	expect: {statusCode: 200}
	});
});

scenario.step('register the third user', function(response) {
	return this.post({
	url: 'register',
	body: {
		firstname: 'User3',
		lastname: 'Ln3',
		email: 'dfgh@asdf.asdf',
		password: 'OCaUYgP1'
	},
	expect: {statusCode: 200}
	});
});

// The next three tests will register 3 new users
scenario.step('registering again the first user (should fail)', function(response) {
	return this.post({
	url: 'register',
	body: {
		firstname: 'User1234567890',
		lastname: 'User1234567890',
		email: 'asdf@asdf.asdf',
		password: 'jjreGF213sA'
	},
	expect: {statusCode: 200}
	});
});

// Then, we check that the login was successful and we extract the returned session token
scenario.step('expecting the server to refuse to register our duplicate user', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}
	
	if (response.body.status != "ko") {
		return this.fail('Could create a duplicate user (this should fail)');
	}
});

// We will then login with a user we just created
scenario.step('login with user1', function(response){
	return this.post({
	url:'account',
	body: {
		email: 'asdf@asdf.asdf',
		password: 'ehVZdHH6'
	},
	expect: { statusCode: 200}
	});
});

// Then, we check that the login was successful and we extract the returned session token
scenario.step('expecting session token in response body', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}
	
	if (response.body.status != "ok") {
		return this.fail('Could not log in. status is not ok');
	}
  
	if (!response.body.hasOwnProperty('data')) {
		return this.fail('No data attribute in response');
	}
	
	if (!response.body.data.hasOwnProperty('session')) {
		return this.fail('No session attribute in response.data');
	}
	
	currentSessionIdUser1 = response.body.data.session;

	console.log('Got session: ' + currentSessionIdUser1);
});

// We create a new poll
scenario.step('creating a new poll', function(){
  return this.post({
    url: 'poll',
	headers: {
		'Authorization': currentSessionIdUser1
	},
    body: pollToCreate1,
	expect: { statusCode: 200}
  });
});

// Then we retrieve a list of all our polls
scenario.step('retrieving poll list', function(resp){
	return this.get({
		url:'polls',
		headers: {
			'Authorization': currentSessionIdUser1
		},
		expect: { statusCode: 200}
	});
});

// The poll we just created must be in the list and it must be in pending state
scenario.step('check the poll has been created', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}
	
	if (response.body.status != "ok") {
		return this.fail('Could not retrieve existing polls. status is not ok');
	}
	
	if (!response.body.hasOwnProperty('data')) {
		return this.fail('No data attribute in response');
	}
	
	console.log("Number of polls: " + response.body.data.length);
	
	if (response.body.data.length != 1) {
		return this.fail('No poll in response');
	}
	
	var returnedPoll = response.body.data[0];
	
	if (returnedPoll.state != "pending") {
		return this.fail('Poll state is not pending');
	}
	
	pollId1 = returnedPoll._id;
	
	// Note: poll name is tested further down
	console.log("The poll has been created. id: " + pollId1);
	
	return;
});

// We then specifically retrieve the created poll
scenario.step('retrieving the created poll', function(){
	console.log('Retrieving poll: ' + pollId1);
	
	return this.get({
		url: 'poll/' + pollId1,
		headers: {
			'Authorization': currentSessionIdUser1
		},
		expect: { statusCode: 200}
	});
});

// The server must answer with the poll we requested (the one we just created)
// We will check the response to make sure the poll is stored as submitted
scenario.step('checking the created poll', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}
	
	if (response.body.status != "ok") {
		return this.fail('Could not retrieve the created poll. status is not ok');
	}
	
	if (!response.body.data.hasOwnProperty('_id')) {
		return this.fail('Returned poll has no _id attribute');
	}
	
	if (response.body.data._id != pollId1) {
		return this.fail('Returned poll id not the same as previously returned');
	}
	
	if (!response.body.data.hasOwnProperty('state')) {
		return this.fail('Poll state has no state attribute');
	}
	
	if (response.body.data.state != "pending") {
		return this.fail('Poll state is not pending');
	}
	
	if (!response.body.data.hasOwnProperty('created_by')) {
		return this.fail('Poll has no created_by attribute');
	}
	
	if (response.body.data.name != pollToCreate1.name) {
		return this.fail('Poll name is not correct');
	}
	
	if (!response.body.data.hasOwnProperty('questions')) {
		return this.fail('Poll has no questions');
	}
	
	var questions = response.body.data.questions;
	
	if (questions.length != pollToCreate1.questions.length) {
		return this.fail('Poll has ' + questions.length + ' questions. Should have ' + pollToCreate1.questions.length + ' questions');
	}
	
	for (var i=0;i<questions.length;i++) {
		var question = questions[i];
		var refQuestion = pollToCreate1.questions[i];
		
		if (!question.hasOwnProperty('name')) {
			this.fail('Question ' + i + ' has no name attribute');
		}
		
		if (!question.hasOwnProperty('allowAnonymous')) {
			this.fail('Question ' + i + ' has no allowAnonymous attribute');
		}
		
		if (!question.hasOwnProperty('maxVote')) {
			this.fail('Question ' + i + ' has no maxVote attribute');
		}
		
		if (!question.hasOwnProperty('timeout')) {
			this.fail('Question ' + i + ' has no timeout attribute');
		}
		
		if (!question.hasOwnProperty('answers')) {
			this.fail('Question ' + i + ' has no answers attribute');
		}
		
		if (question.name != refQuestion.name) {
			this.fail('Question ' + i + ' name is invalid');
		}
		
		if (question.allowAnonymous != refQuestion.allowAnonymous) {
			this.fail('Question ' + i + ' name is invalid');
		}
		
		if (question.maxVote != refQuestion.maxVote) {
			this.fail('Question ' + i + ' maxVote is invalid');
		}
		
		if (question.timeout != refQuestion.timeout) {
			this.fail('Question ' + i + ' timeout is invalid');
		}
		
		for (var y=0;y<question.answers.length;y++) {
			var answer = question.answers[y];
			var refAnswer = refQuestion.answers[y];
			
			if (answer.name != refAnswer.name) {
				this.fail('Question ' + i + ' answer ' + y + ' name in invalid');
			}
		}
	}
	
	console.log('Created poll is checked');
	
	return;
});

// We edit the poll
scenario.step('sending a request to edit the newly created poll', function(){
  return this.put({
    url: 'poll/' + pollId1,
	headers: {
		'Authorization': currentSessionIdUser1
	},
    body: pollToCreate2,
	expect: { statusCode: 200}
  });
});

// The server must respond to our poll edit request with a success
scenario.step('checking the server accepted our modification request', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}

	if (response.body.status != "ok") {
		return this.fail('Could not edit the poll. status is not ok');
	}
	
	return;
});

// We then specifically retrieve the created poll
scenario.step('retrieving the edited poll', function(){
	console.log('Retrieving poll: ' + pollId1);
	
	return this.get({
		url: 'poll/' + pollId1,
		headers: {
			'Authorization': currentSessionIdUser1
		},
		expect: { statusCode: 200}
	});
});

// The server must answer with the poll we requested (the one we just created)
// We will check the response to make sure the poll is stored as submitted
scenario.step('checking the edited poll', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}
	
	if (response.body.status != "ok") {
		return this.fail('Could not retrieve the created poll. status is not ok');
	}
	
	if (!response.body.data.hasOwnProperty('_id')) {
		return this.fail('Returned poll has no _id attribute');
	}
	
	if (!response.body.data.hasOwnProperty('name')) {
		return this.fail('Returned poll has no name attribute');
	}
	
	if (response.body.data._id != pollId1) {
		return this.fail('Returned poll id not the same as previously returned');
	}
	
	if (response.body.data.name != pollToCreate2.name) {
		return this.fail('Returned poll id is invalid');
	}
	
	if (response.body.data.questions.length != pollToCreate2.questions.length) {
		return this.fail('Returned invalid number of questions');
	}
	
	return;
});

// We will then open a non-existing poll
scenario.step('opening a non-existing poll part1', function(){
  return this.post({
    url: 'poll/opened/' + 'abcdefghijklmnopq1234567890',
	headers: {
		'Authorization': currentSessionIdUser1
	},
	expect: { statusCode: 200}
  });
});

// The server must respond with an error
scenario.step('opening a non-existing poll part2', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}

	if (response.body.status != "ko") {
		return this.fail('The server accepted the creation');
	}
	
	return;
});

// We will then open the poll
scenario.step('opening the created poll part1', function(){
  return this.post({
    url: 'poll/opened/' + pollId1,
	headers: {
		'Authorization': currentSessionIdUser1
	},
	expect: { statusCode: 200}
  });
});

// The server must respond to our poll open request with a success
scenario.step('opening the created poll part2', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}

	if (response.body.status != "ok") {
		return this.fail('Could not open the poll. status is not ok');
	}
	
	return;
});

// We then try to open the poll again. This should result in failure (because it is already open)
scenario.step('opening again the created poll part1', function(){
  return this.post({
    url: 'poll/opened/' + pollId1,
	headers: {
		'Authorization': currentSessionIdUser1
	},
	expect: { statusCode: 200}
  });
});


// The server must respond to our poll open request with a FAILURE
scenario.step('opening again the created poll part2', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}

	if (response.body.status != "ko") {
		return this.fail('Poll could be opened. This is an error.');
	}
});

// We then try to retrieve the poll. This should FAIL because it cannot be edited (it is in the opened state)
scenario.step('retrieving the opened poll', function(){
	console.log('Retrieving poll: ' + pollId1);
	
	return this.get({
		url: 'poll/' + pollId1,
		headers: {
			'Authorization': currentSessionIdUser1
		},
		expect: { statusCode: 200}
	});
});

// The server must answer with the poll we requested (the one we just created)
// We will check the response to make sure the poll is stored as submitted
scenario.step('server must reject our request because the poll is already open', function(response){
	if (!response.body.hasOwnProperty('status')) {
		return this.fail('No status attribute in response');
	}
	
	if (response.body.status != "ko") {
		return this.fail('The poll could be retrieved. This should not happen because it is opened.');
	}
});

// Finally, we gather the actual stats, which of course must have changed because of our requests
scenario.step('getting final stats', function() {
	return this.get({
		url: 'stats',
		expect: {statusCode: 200}
	});
});

// We make sure the final stats are correct
scenario.step('checking final stats', function(response) {
	
	if (!response.body.hasOwnProperty('usersCount')) {
		return this.fail('No usersCount attribute in response');
	}

	if (!response.body.hasOwnProperty('pollsCount')) {
		return this.fail('No pollsCount attribute in response');
	}
	
	if (!response.body.hasOwnProperty('openPollsCount')) {
		return this.fail('No openPollsCount attribute in response');
	}
	
	// We created 3 users
	if (response.body.usersCount != initialStats.usersCount + 3) {
		return this.fail('Final stats do not reflect the users created');
	}
	
	// We created one poll
	if (response.body.pollsCount != initialStats.pollsCount + 1) {
		return this.fail('Final stats do not reflect the polls created');
	}
	
	// We have one opened poll
	if (response.body.openPollsCount != initialStats.openPollsCount + 1) {
		return this.fail('Final stats do not reflect the opened polls created');
	}
});

// Export the scenario for API Copilot to use
module.exports = scenario;
