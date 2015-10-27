var _ = require('underscore'), copilot = require('api-copilot');


// create an API scenario
var scenario = new copilot.Scenario({
  name: 'Premier Scenario',
  summary: 'peupler l\'API avec des données',
  baseUrl: 'http://localhost:8080',
  defaultRequestOptions: {
    json: true
  }
});

// Définition des étapes (steps)
scenario.step('go to homepage', function(){
  return this.get({
    url: '/',
    expect: {statusCode: 200},
    json: false,
    headers: {Accept: 'text/html'}
  });
});


scenario.step('register a user', function(response) {
  // make HTTP calls
  return this.post({
    url: '/account',
    body: {
      firstname: 'User1',
      lastname: 'Ln1',
      email: 'asdf@asdf.asdf',
      password: 'changeme'
    },
    expect: {statusCode: 200}
  });
});

scenario.step('register a second user', function(response) {
  // make HTTP calls
  return this.post({
    url: '/account',
    body: {
      firstname: 'User2',
      lastname: 'Ln2',
      email: 'sdfg@asdf.asdf',
      password: 'changeme'
    },
    expect: {statusCode: 200}
  });
});

scenario.step('register a user', function(response) {
  // make HTTP calls
  return this.post({
    url: '/account',
    body: {
      firstname: 'User3',
      lastname: 'Ln3',
      email: 'dfgh@asdf.asdf',
      password: 'changeme'
    },
    expect: {statusCode: 200}
  });
});



// each step gets the result from the previous step

scenario.step('login with previous info', function(response){
  return this.post({
    url:'/account',
    body: {
      email: 'asdf@asdf.asdf',
      password: 'changeme'
    },
    expect: { statusCode: 200}
  });
});

// User1 créé un poll

scenario.step('create a poll', function(response){
  return this.post({
    url:'/poll',
    body: {
      'name': "Poll test 1",
      'questions':[{
        'name': "Question test 1 What is the coolest animal ?",
        'allowAnonymous': false,
        'maxVote': 5,
        'timeout': 45,
        'answers': [{
          'name': "The cat"
        },{
          'name': "The dog"
        }]
      },{
        'name': "Question test 2 what is the sweetest ?",
        'allowAnonymous': false,
        'maxVote': 5,
        'timeout': 45,
        'answers': [{
          'name': "paper"
        },{
          'name': "silk"
        },{
          'name': "hamster wool"
        }]
      }]
    }
  });
});

// Modifier le poll
// Ouvrir le poll (par user1)

scenario.step

// Ajouter des utilisateurs au poll




// Export the scenario for API Copilot to use
module.exports = scenario;
