/*
This file contains the "home" controller which displays the app stats.
*/
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

// Mongoose schemas
var User = mongoose.model('User');
var Poll = mongoose.model('Poll');

module.exports = function (app) {
  app.use('/', router);
};


// Retrieve information for the home page
router.get('/', function(req, res) {
	User.count({}, function(err, usersCount){
		Poll.count({}, function(err, pollsCount) {
			Poll.count({'state': 'opened'}, function(err, pollsCountOpened) {
				res.render('index', { 'title': 'Home page',
				           'usersCount': usersCount,
				           'pollsCount': pollsCount,
				           'openPollsCount': pollsCountOpened });
			});
		});
	});
});