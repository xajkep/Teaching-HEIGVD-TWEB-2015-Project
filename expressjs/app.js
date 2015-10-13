var express = require('express');
var session = require('express-session');
var glob = require('glob');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');


var mongoDBConfig = 'mongodb://localhost/tweb';
var appListenOnPortConfig = 8080;
var sessionSecret = 'iV3yS6w9FBSPMkvLY89OwAUWHvZM0iH6';

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
app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');

var controllers = glob.sync(__dirname + '/app/controllers/*.js');
controllers.forEach(function (controller) {
	require(controller)(app);
});

app.listen(appListenOnPortConfig, function () {
  console.log('Express server listening on port ' + appListenOnPortConfig);
});

app.set('trust proxy', 1);
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true , id: 1234 }
}));

// Static pages (such as angularjs, css and client-side js) are statically served
app.use('/static', express.static('app/static'));
