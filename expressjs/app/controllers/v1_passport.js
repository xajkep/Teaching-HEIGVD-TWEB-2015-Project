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
var FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose');
var Cookies = require('cookies');

// Mongoose schemas
var User = mongoose.model('User');


module.exports = function (a) {
	a.use('/api/v1/callbacks', router);
};

app.use(passport.initialize());

function authOrCreateUser(realm, profile, done) {

	//console.log("SSO Profile received: %j", profile);
	
	// Sanity check. At least one email should be received.
	if (profile.emails.length > 0) {
		var userEmail = profile.emails[0].value;
		var userFirstName = profile.displayName;
		var userLastName = profile.displayName;

		console.log("Received callback from " + realm + " from email: " + userEmail);

		User.findOne({ 'email': userEmail }, '_id', function (err, userFound) {
			if (err || userFound == null){
				console.log(realm + " callback. The following email does not exist locally, creating it: " + userEmail);
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
							"email": newUser.email
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
				
				console.log(realm + " callback. The following email does exist: " + userEmail);
				return done(null, profile);
			}
		});
	} else {
		return done(["No email provided"]);
	}
}

function ssoSuccessCreateSession(req, res) {
	// Basic check : are we coming from a SSO strategy or is it just a user browsing our urls?
	if (req.hasOwnProperty("user") && req.user.hasOwnProperty("custom")) {
		console.log("Authenticated using SSO: %j", req.user.custom);
		
		// Generating a new token for the authenticated user
		var userSessionToken = jwt.sign({ userId: req.user.custom._id }, sessionSecret, {
										   expiresIn: 3600 * 6
										});
										
		
		// Old technique. Can still be used but is less secure since the session is visible for a plit instant in the url bar.
		//res.redirect('/sp/#/login?session=' + userSessionToken + '&email=' + req.user.custom.email);
		
		// Adding the cookies. These will be analyzed by our AngularJS login page, that will immediately delete them once they have been read.
		// httpOnly MUST be set to false for the cookies to be accessible from AngularJS!
		var cookies = new Cookies(req, res);
		cookies.set('session', userSessionToken, { 'httpOnly': false, 'overwrite': true, 'maxAge': 30000 });
		cookies.set('email', req.user.custom.email, { 'httpOnly': false, 'overwrite': true, 'maxAge': 30000 });
		
		res.writeHead(302, { 'Location': '/sp/#/login' });
		res.end();
		
		delete req.user.custom;
	} else {
		res.redirect('/');
	}
}


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// GitHub start

passport.use(new GitHubStrategy({
    clientID: passportConfig.passportGitHubClientId,
    clientSecret: passportConfig.passportGitHubClientSecret,
    callbackURL: passportConfig.passportGitHubCallbackUrl
  },
  function(accessToken, refreshToken, profile, done) {
		authOrCreateUser("GitHub", profile, done);	
  }
));

router.get('/redirect_github', passport.authenticate('github', { scope: [ 'user:email' ] }),
	function(req, res){}
);

router.get('/github',  passport.authenticate('github', { failureRedirect: '/sp/#/login' }),
	function(req, res) {
		ssoSuccessCreateSession(req, res);
	}
);

// GitHub end

// Facebook start

passport.use(new FacebookStrategy({
    clientID: passportConfig.passportFacebookClientId,
    clientSecret: passportConfig.passportFacebookClientSecret,
    callbackURL: passportConfig.passportFacebookCallbackUrl,
	profileFields: ['emails']
  },
  function(accessToken, refreshToken, profile, done) {
		authOrCreateUser("Facebook", profile, done);	
  }
));

router.get('/redirect_facebook', passport.authenticate('facebook', { scope: [ 'email' ] }),
	function(req, res){}
);

router.get('/facebook', passport.authenticate('facebook', { failureRedirect: '/sp/#/login' }),
	function(req, res){
		ssoSuccessCreateSession(req, res);
	}
);

// Facebook end
