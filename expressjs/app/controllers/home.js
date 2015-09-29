var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res) {

  res.format({
    'application/json': function() {
      res.send(beers);
    },
    'text/html': function() {
      res.render('index', {'title': 'Bon.'});
    }
  });
});

router.post('/', function(req, res) {
});
