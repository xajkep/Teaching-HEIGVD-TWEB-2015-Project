var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var url = require('url');

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/testmongoose', router);
};

router.get('/getPolls', function (req, res) {

	console.log('Getting polls');

	Poll.find({}).populate('created_by').exec(function(err, polls) {
		polls.forEach(function(poll) {
		  console.log('Poll: ' + poll);
		});
	});
});

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
			}
		});
	})
});


router.get('/updateUser', function (req, res) {

	var urlParts = url.parse(req.url, true);
	var userIdToEdit = urlParts.query.id;
	var newFirstname = urlParts.query.firstname;

	console.log('Updating user[id=' + userIdToEdit + '] setting[firstname=' + newFirstname + ']');

	User.findOneAndUpdate({ '_id': userIdToEdit }, { 'firstname': newFirstname }, function (err, person) {
	  if (err) return handleError(err);

		console.log('User Updated: ' + person);
	})
});

router.post('/', function(req, res) {
});
