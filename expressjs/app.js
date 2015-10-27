var express = require('express');
var glob = require('glob');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');





var mongoDBConfig = 'mongodb://localhost/tweb' // 'mongodb://localhost/tweb' 'mongodb://tweb:dwmrqi5y@ds043694.mongolab.com:43694/tweb';
var appListenOnPortConfig = process.env.PORT || 8080;
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

var server = app.listen(appListenOnPortConfig, function () {
  console.log('Express server listening on port ' + appListenOnPortConfig);
});

var sio = require('socket.io').listen(server);

module.exports = {
	'sio': sio
};


var controllers = glob.sync(__dirname + '/app/controllers/*.js');
controllers.forEach(function (controller) {
	require(controller)(app);
});

// Static pages (such as angularjs, css and client-side js) are statically served
app.use('/', express.static(__dirname + '/app/static'));


