var express = require('express');
var glob = require('glob');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var https = require('https');
var fs = require('fs');

// MongoDB connection string
var mongoDBConfig = process.env.DATABASE_STRING || null;

if (mongoDBConfig == null) {
	throw new Error('the DATABASE_STRING environment variable is not defined');
}

// Listening port. Is the same for the Web server and the Socket.IO server
var appListenOnPortConfig = process.env.PORT || 8080;

// HMAC secret used to secure pseudo-sessions against tampering
var sessionSecret = process.env.SESSION_SECRET || null;

if (sessionSecret == null) {
	throw new Error('the SESSION_SECRET environment variable is not defined');
}

var passportGitHubCallbackUrl = process.env.PASSPORT_GITHUB_CALLBACK_URL || null;

if (passportGitHubCallbackUrl == null) {
	throw new Error('the PASSPORT_GITHUB_CALLBACK_URL environment variable is not defined');
}

var passportGitHubClientId = process.env.PASSPORT_GITHUB_CLIENT_ID || null;

if (passportGitHubClientId == null) {
	throw new Error('the PASSPORT_GITHUB_CLIENT_ID environment variable is not defined');
}

var passportGitHubClientSecret = process.env.PASSPORT_GITHUB_CLIENT_SECRET || null;

if (passportGitHubClientSecret == null) {
	throw new Error('the PASSPORT_GITHUB_CLIENT_SECRET environment variable is not defined');
}

var passportFacebookCallbackUrl = process.env.PASSPORT_FACEBOOK_CALLBACK_URL || null;

if (passportFacebookCallbackUrl == null) {
	throw new Error('the PASSPORT_FACEBOOK_CALLBACK_URL environment variable is not defined');
}

var passportFacebookClientId = process.env.PASSPORT_FACEBOOK_CLIENT_ID || null;

if (passportFacebookClientId == null) {
	throw new Error('the PASSPORT_FACEBOOK_CLIENT_ID environment variable is not defined');
}

var passportFacebookClientSecret = process.env.PASSPORT_FACEBOOK_CLIENT_SECRET || null;

if (passportFacebookClientSecret == null) {
	throw new Error('the PASSPORT_FACEBOOK_CLIENT_SECRET environment variable is not defined');
}

var enableSSL = false;
var whenSSLEnabledAlsoRedirectHttp;
var sslPrivateKeyPath = process.env.SSL_PRIVATE_KEY_PATH || null;
var sslCertificatePath = process.env.SSL_CERTIFICATE_PATH || null;

if (sslPrivateKeyPath !== null && sslCertificatePath !== null) {
	enableSSL = true;
	var sslRedirect80ToSecureEnv = process.env.SSL_REDIRECT_80_TO_SECURED || null;
	whenSSLEnabledAlsoRedirectHttp = sslRedirect80ToSecureEnv == "true";
}

// Establishing a connection to our MongoDB server
mongoose.connect(mongoDBConfig);

var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoDBConfig);
});

// MongoDB fake schemas import
require(__dirname + '/app/db/schemas.js');

// Mongoose schemas
var Poll = mongoose.model('Poll');

// Closing all polls that happened to be opened when the server closed
Poll.update({'state': 'opened' }, {'state': 'closed'}, {'multi': true}, function(err, numAffected) {
});

// Express configuration
var app = express();

app.use(bodyParser.json());

// Setting our view parameters
app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');

// Binding the listening socket
var server;

if (!enableSSL) {
	server = app.listen(appListenOnPortConfig, function () {
		console.log('Express server listening on port ' + appListenOnPortConfig);
	});
} else {
	console.log('Reading SSL: private key path: ' + sslPrivateKeyPath);
	console.log('Reading SSL: certificate path: ' + sslCertificatePath);
	
	var sslOptions = {
		key: fs.readFileSync(sslPrivateKeyPath),
		cert: fs.readFileSync(sslCertificatePath),
	};
	
	server = https.createServer(sslOptions, app).listen(appListenOnPortConfig, function () {
		console.log('Express server with SSL listening on port ' + appListenOnPortConfig);
	});
	
	if (whenSSLEnabledAlsoRedirectHttp) {
		
		if (appListenOnPortConfig == 80) {
			console.log('Cannot redirect unsecured to secured because the app is configured to listen on port 80');
		} else {
			console.log('Creating the listener on port 80 that will redirect clients to the SSL secured port');
			
			require('http').createServer(function (req, res) {
				res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
				res.end();
			}).listen(80);
		}
	}
}

// Socket.IO will listen on the same port as our Web server
var sio = require('socket.io').listen(server);

// We export the socket.io config
// as well as the secret used to sign the sessions (so we can use them in our api file)
module.exports = {
	'app': app,
	'sio': sio,
	'sessionSecret': sessionSecret,
	'passport' : { 'passportGitHubClientId': passportGitHubClientId,
	               'passportGitHubClientSecret': passportGitHubClientSecret,
	               'passportGitHubCallbackUrl': passportGitHubCallbackUrl,
				   'passportFacebookClientId': passportFacebookClientId,
	               'passportFacebookClientSecret': passportFacebookClientSecret,
	               'passportFacebookCallbackUrl': passportFacebookCallbackUrl
				}
};

// Including all constrollers in our controllers folder
var controllers = glob.sync(__dirname + '/app/controllers/*.js');
controllers.forEach(function (controller) {
	require(controller)(app);
});

// Static pages (such as angularjs, css and client-side js) are statically served
app.use('/sp', express.static(__dirname + '/app/static'));
