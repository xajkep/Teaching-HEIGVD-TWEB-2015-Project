var express = require('express');
var router = express.Router();
var appjs = require(__dirname + '/../../app.js');
var app = appjs.app;
var sessionSecret = appjs.sessionSecret;
var passportConfig = appjs.passport;
var common = require(__dirname + '/../common/common.js');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
var mongoose = require('mongoose');

// Mongoose schemas
var User = mongoose.model('User');


module.exports = function (a) {
	a.use('/api/v1/callbacks', router);
};

app.use(passport.initialize());


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: passportConfig.passportGitHubClientId,
    clientSecret: passportConfig.passportGitHubClientSecret,
    callbackURL: passportConfig.passportGitHubCallbackUrl
  },
  function(accessToken, refreshToken, profile, done) {

	var userEmail = profile.emails[0].value;
	var userFirstName = profile.displayName;
	var userLastName = profile.displayName;

	console.log("Received callback from GitHub from email: " + userEmail);

	User.findOne({ 'email': userEmail }, '_id', function (err, userFound) {
		if (err){
			console.log("GitHub callback. The following email does not exist locally, creating it: " + userEmail);
			common.generateId(function(generatedId) {
				var newUser = new User({ _id: generatedId,
										 email: userEmail,
										 salt: "",
										 encrypted_password: "",
										 firstname: userFirstName,
										 lastname: userLastName });
				
				// Our new user is then inserted in the database						
				newUser.save(function (err, newUser) {
					// This is used to pass variables
					profile.custom = {
						"_id": newUser._id,
						"email": newUser.email,
					};
					return done(null, profile);
				});
			});
		} else {
			// This is used to pass variables
			profile.custom = {
				"_id": userFound._id,
				"email": userEmail,
			};
			
			console.log("GitHub callback. The following email does exist: " + userEmail);
			return done(null, profile);
		}
	});
  }
));

router.get('/redirect_github', passport.authenticate('github', { scope: [ 'user:email' ] }),
	function(req, res){}
);

router.get('/github',  passport.authenticate('github', { failureRedirect: '/sp/#/login' }),
	function(req, res) {
		
		// Basic check : are we coming from GitHubStrategy or is it just a user browsing our urls?
		if (req.hasOwnProperty("user") && req.user.hasOwnProperty("custom")) {
			console.log("Authenticated using GitHub: %j", req.user.custom);
			
			// Generating a new token for the authenticated user
			var userSessionToken = jwt.sign({ userId: req.user.custom._id }, sessionSecret, {
											   expiresIn: 3600 * 6
											});
											
			
			res.redirect('/sp/#/login?session=' + userSessionToken + '&email=' + req.user.custom.email);
			
			delete req.user.custom;
		} else {
			res.redirect('/');
		}
	}
);
