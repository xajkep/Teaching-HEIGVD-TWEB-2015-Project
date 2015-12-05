var express = require('express');
var glob = require('glob');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

// MongoDB connection string
var mongoDBConfig = process.env.DATABASE_STRING || null;

if (mongoDBConfig == null) {
	throw new Error('the DATABASE_STRING environment variable is not defined');
}

// Listening port. Is the same for the Web server and the Socket.IO server
var appListenOnPortConfig = process.env.PORT || 8080;

// HMAC secret used to secure pseudo-sessions against tampering
var sessionSecret = 'VlL_LGgy5yu89-nW+7U6f7u0TbIlmP.z';

// Establishing a connection to our MongoDB server
mongoose.connect(mongoDBConfig);

var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoDBConfig);
});

// MongoDB fake schemas import
require(__dirname + '/app/db/schemas.js');

// Express configuration
var app = express();

app.use(bodyParser.json());

// Setting our view parameters
app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');

// Binding the listening socket
var server = app.listen(appListenOnPortConfig, function () {
  console.log('Express server listening on port ' + appListenOnPortConfig);
});

// Socket.IO will listen on the same port as our Web server
var sio = require('socket.io').listen(server);

// We export the socket.io config
// as well as the secret used to sign the sessions (so we can use them in our api file)
module.exports = {
	'sio': sio,
	'sessionSecret': sessionSecret
};

// Including all constrollers in our controllers folder
var controllers = glob.sync(__dirname + '/app/controllers/*.js');
controllers.forEach(function (controller) {
	require(controller)(app);
});

// Static pages (such as angularjs, css and client-side js) are statically served
app.use('/sp', express.static(__dirname + '/app/static'));
