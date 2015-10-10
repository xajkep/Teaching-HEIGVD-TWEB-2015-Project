var express = require('express');
var crypto = require('crypto');
var session = require('express-session');
var router = express.Router();
var mongoose = require('mongoose');
var url = require('url');
var qs = require('querystring');

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');


module.exports = function (app) {
  app.use('/testmongoose', router);
};

// Old
router.get('/getPolls', function (req, res) {

	console.log('Getting polls');

	Poll.find({}).populate('created_by').exec(function(err, polls) {
		polls.forEach(function(poll) {
		  console.log('Poll: ' + poll);
		});
	});
});

// Old
router.get('/closePoll', function (req, res) {

	var urlParts = url.parse(req.url, true);
	var pollIdRequested = urlParts.query.id;

	console.log('Closing poll');

	Poll.findOne({ _id: pollIdRequested }, function (err, poll){
	  if (err) return console.error(err); // Poll not found
	  poll.state = 'closed';

	  poll.save(function (err, poll) {
		if (err) return console.error(err);
		console.log('Poll closed ' + poll);
	  });
	});
});

<<<<<<< HEAD
router.get('/createPoll', function (req, res) {

	console.log('Adding new poll');

	var newPoll = new Poll({ _id: '927253287',
 	                         state: 'open',
							 created_by: 'idbon',
							 creation_date: new Date(),
							 name: 'Default poll',
							 questions: [ {
								             _id: '927253287-0',
											 name: "Quel âge avez-vous?",
											 max_user_vote: 1,
											 can_vote_as_anonymous: true,
											 answers: [ {
												           _id: '927253287-0-0',
														   name: 'Entre 10 et 15 ans',
														   users: [ 'idbon' ]
											            },
														{
												           _id: '927253287-0-1',
														   name: 'Entre 15 et 20 ans',
														   users: []
											            },
														{
												           _id: '927253287-0-2',
														   name: 'Entre 20 et 30 ans',
														   users: []
											            },
														{
												           _id: '927253287-0-3',
														   name: 'Plus que 30 ans',
														   users: []
											            }
											          ]
							              }

							            ]});

	newPoll.save(function (err, newPoll) {
		if (err) return console.error(err);
		console.log('Poll added ' + newPoll);
	});
});

router.get('/addUser', function (req, res) {

	console.log('Adding new user');

	var newUser = new User({ _id: 'idbon',
 	                         email: 'bon@bon.com',
							 salt: '123456',
							 encrypted_password: 'sosecure',
							 firstname: 'Luc',
							 lastname: 'Dupont' });

	newUser.save(function (err, newUser) {
		if (err) return console.error(err);
		console.log('User added ' + newUser);
	});
});

router.get('/getUser', function (req, res) {

	var urlParts = url.parse(req.url, true);
	var userIdRequested = urlParts.query.id;

	console.log('Selecting user[id=' + userIdRequested + ']');

	User.findOne({ '_id': userIdRequested }, 'salt encrypted_password', function (err, person) {
	  if (err) return handleError(err);

		console.log('User found: ' + person);

		res.format({
			'application/json': function() {
			  res.send(person);
			},
			'text/html': function() {
			  res.render('testmongoose', { 'salt': person.salt, 'encrypted_password': person.encrypted_password });
=======
// Create new poll
router.all('/createPoll', function (req, res) {
	
	// TO-DO: check user session
	// TO-DO: check duplicate name
	
	var errors = [];
	var newPollDTO = {};
	var respondCallback = function () { respondToUser(res, errors); };

	if (!req.body.hasOwnProperty("name")) {
		errors.push("Poll name not supplied");
	}

	if (!req.body.hasOwnProperty("questions")) {
		errors.push("Poll questions not supplied");
	} else {
		
		var pollName = req.body.name;
	
		newPollDTO.name = pollName;
		newPollDTO.questions = [];
		
		if (req.body.questions.length < 1) {
			errors.push("At least one question must be specified");
		}
		
		for (var questionIndex = 0; questionIndex < req.body.questions.length ; questionIndex++) {
			var currentQuestionDTO = {};
			var currentQuestion = req.body.questions[questionIndex];
			
			if (!currentQuestion.hasOwnProperty("name")) {
				errors.push("Question has no name");
				break;
			}

			if (!currentQuestion.hasOwnProperty("allowAnonymous")) {
				errors.push("Question has no allowAnonymous");
				break;
			}
			
			if (!currentQuestion.hasOwnProperty("maxVote")) {
				errors.push("Question has no maxVote");
				break;
			}
			
			if (!currentQuestion.hasOwnProperty("answers")) {
				errors.push("Question has no answers");
				break;
			}
			
			var currentQuestionName = currentQuestion.name;
			var currentQuestionAllowAnonymous = currentQuestion.allowAnonymous;
			var currentQuestionMaxVotes = currentQuestion.maxVote;
			var currentQuestionAnswers = currentQuestion.answers;
			
			currentQuestionDTO.name = currentQuestionName;
			currentQuestionDTO.allowAnonymous = currentQuestionAllowAnonymous;
			currentQuestionDTO.maxVote = currentQuestionMaxVotes;
			currentQuestionDTO.answers = [];

			console.log("Question: " + currentQuestionName);
			
			if (currentQuestionAnswers.length < 2) {
				errors.push("At least one answer must be specified");
			}
			
			for (var answerIndex = 0; answerIndex < currentQuestionAnswers.length ; answerIndex++) {
				var currentAnswerDTO = {};
				var currentAnswer = currentQuestionAnswers[answerIndex];
				
				if (!currentQuestion.hasOwnProperty("name")) {
					errors.push("Answer has no name");
					break;
				}
				
				var currentAnswerName = currentAnswer.name;
				currentAnswerDTO.name = currentAnswerName;
				
				console.log("  Answer: " + currentAnswerName);
				
				currentQuestionDTO.answers.push(currentAnswerDTO);
			}
			
			newPollDTO.questions.push(currentQuestionDTO);
			
			if (errors.length > 0) {
				break;
			}
		}
		
		//console.log("newPollDTO: %j", newPollDTO);
	}
	
	if (errors.length == 0) {
		
		// REPLACE WITH SESSION
		var userCreatingPoll = '3efd5efdd371803710bdc72756b21735e793dcfc';
		
		generateId(function(generatedPollId) {
			console.log('Adding new poll');
			
			var newPoll = new Poll({ _id: generatedPollId,
									 state: 'pending',
									 created_by: userCreatingPoll,
									 creation_date: new Date(),
									 name: newPollDTO.name });
									 
			newPoll.questions = [];

			for (var indexQuestion = 0 ; indexQuestion < newPollDTO.questions.length; indexQuestion++) {
				var currentQuestion = newPollDTO.questions[indexQuestion];
				var currentQuestionToAdd = { _id: generatedPollId + '-' + indexQuestion,
											 name: currentQuestion.name,
											 maxVote: currentQuestion.maxVote,
											 allowAnonymous: currentQuestion.allowAnonymous,
											 answers: []
											};
				
				for (var indexAnswer = 0 ; indexAnswer < currentQuestion.answers.length; indexAnswer++) {
					var currentAnswer = currentQuestion.answers[indexAnswer];
					currentQuestionToAdd.answers.push({_id: generatedPollId + '-' + indexQuestion + '-' + indexAnswer,
													   name: currentAnswer.name,
													   users: []});
				}
				
				newPoll.questions.push(currentQuestionToAdd);
			}
										   
			newPoll.save(function (err, newPoll) {
				if (err) {
					errors.push('Cannot add poll');
				} else {
					console.log('Poll added');
				}
				
				respondCallback();
			});
		});
	} else {
		respondCallback();
	}
});

// New user account
router.put('/register', function (req, res) {
	var errors = [];

	if (!req.body.hasOwnProperty("email")) {
		errors.push("Email not supplied");
	}
	
	if (!req.body.hasOwnProperty("firstname")) {
		errors.push("Firstname not supplied");
	}
	
	if (!req.body.hasOwnProperty("lastname")) {
		errors.push("Lastname not supplied");
	}
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	if (errors.length == 0) {
		User.findOne({ email: req.body.email }, function (err, user){
		  if (user != null) {
			  // Email already registered
			  errors.push("Email already registered");
			  respondToUser(res, errors);
		  } else {
			generateId(function(generatedId) {
				generateSalt(function(generatedSalt) {
					hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {
						console.log("Inserting user: " + generatedId);
						console.log("Salt: " + generatedSalt);
						console.log("Encrypted password: " + encryptedPassword);
					
						var newUser = new User({ _id: generatedId,
												 email: req.body.email,
												 salt: generatedSalt,
												 encrypted_password: encryptedPassword,
												 firstname: req.body.firstname,
												 lastname: req.body.lastname });
												   
						newUser.save(function (err, newUser) {
							if (err) {
								errors.push("Cannot insert into database");
								console.error(err);
							} else {
								console.log('User added ' + newUser);
							}

							respondToUser(res, errors);
						});
					});
				});
			}); 
		  }
		});
	} else {
		respondToUser(res, errors);
	}
});

function generateId(callback) {
	require('crypto').randomBytes(20, function(ex, buf) {
		var generatedId = buf.toString('hex');
		callback(generatedId);
	}); 
}

function generateSalt(callback) {
	require('crypto').randomBytes(20, function(ex, buf) {
		var generatedSalt = buf.toString('hex');
		callback(generatedSalt);
	}); 
}

function hashPassword(salt, clearPassword, callback) {
	var hashPassword = crypto.createHash('sha256').update(clearPassword).digest('hex');
	var encryptedPassword = crypto.createHash('sha256').update(hashPassword + salt).digest('hex');
	callback(encryptedPassword);
}

function respondToUser(res, errors) {
	var responseObject =
	{
	  'status': errors.length == 0 ? "ok" : "ko",
	  'messages': errors
	};
	
	
	res.format({
		'application/json': function() {
		  res.send(responseObject);
		}
	});
}

 function checkStringTimeConst(val1, val2) {
  return crypto.createHash('sha256').update(val1).digest('hex') == crypto.createHash('sha256').update(val2).digest('hex');
}

// Authenticate user
router.all('/login', function (req, res) {

	var errors = [];

	if (!req.body.hasOwnProperty("email")) {
		errors.push("Email not supplied");
	}
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	var respondCallback = function () { respondToUser(res, errors); };

	if (errors.length == 0) {
		User.findOne({ 'email': req.body.email }, '_id salt encrypted_password', function (err, userFound) {
			if (err) {
				errors.push("User not found");
			} else {
				hashPassword(userFound.salt, req.body.password, function(encryptedPasswordComputed) {
					if (checkStringTimeConst(encryptedPasswordComputed, userFound.encrypted_password)) {
						// User provided correct password
						//req.session.cookie.userId = userFound._id;
						//res.header('Authorization', req.sessionID);
						console.log('User authenticated ' + req.body.email);
						
					} else {
						errors.push("Incorrect password");
					}
				});
>>>>>>> 58ae2978238e54e14848cdb626a51081db22659f
			}
			
			respondCallback();
		});
	} else {
		respondCallback();
	}
});

<<<<<<< HEAD

router.get('/updateUser', function (req, res) {

	var urlParts = url.parse(req.url, true);
	var userIdToEdit = urlParts.query.id;
	var newFirstname = urlParts.query.firstname;

	console.log('Updating user[id=' + userIdToEdit + '] setting[firstname=' + newFirstname + ']');

	User.findOneAndUpdate({ '_id': userIdToEdit }, { 'firstname': newFirstname }, function (err, person) {
	  if (err) return handleError(err);

		console.log('User Updated: ' + person);
	})
=======
// Edit password
router.all('/password', function (req, res) {
	
	var errors = [];
	
	if (!req.body.hasOwnProperty("password")) {
		errors.push("Password not supplied");
	}
	
	var respondCallback = function () { respondToUser(res, errors); };
	
	if (errors.length == 0) {
		// REPLACE WITH SESSION
		var userIdToEdit = '3efd5efdd371803710bdc72756b21735e793dcfc';
		
		console.log('Updating password for user ' + userIdToEdit);
		
		generateSalt(function(generatedSalt) {
			hashPassword(generatedSalt, req.body.password, function(encryptedPassword) {
				
				console.log('New salt ' + generatedSalt);
				console.log('New encrypted password ' + encryptedPassword);
				
				User.findOneAndUpdate({ '_id': userIdToEdit }, { 'salt': generatedSalt, 'encrypted_password': encryptedPassword }, function (err, person) {
					if (err) {
						errors.push("Cannot update database");
					} else {
						console.log('Password updated');
					}
					
					respondCallback();
				});
			});
		});
	} else {
		respondCallback();
	}
>>>>>>> 58ae2978238e54e14848cdb626a51081db22659f
});

router.post('/', function(req, res) {
});
