var express = require('express');
var glob = require('glob');
var mongoose = require('mongoose');


var mongoDBConfig = 'mongodb://localhost/tweb';
var appListenOnPortConfig = 8080;
  
mongoose.connect(mongoDBConfig);

var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoDBConfig);
});

// MongoDB fake schemas import
require(__dirname + '/app/db/schemas.js');

// Express configuration
var app = express();

app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');

var controllers = glob.sync(__dirname + '/app/controllers/*.js');
controllers.forEach(function (controller) {
	require(controller)(app);
});

app.listen(appListenOnPortConfig, function () {
  console.log('Express server listening on port ' + appListenOnPortConfig);
});
