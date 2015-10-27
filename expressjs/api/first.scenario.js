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
  return this.put({
    url:'/poll',
    body: {
      'name': "Poll test 1",
      'questions':[{
        'name': "Question test 1 Quel est l'animal le plus cool ?",
        'allowAnonymous': false,
        'maxVote': 5,
        'timeout': 45,
        'answers': [{
          'name': "Le chat"
        },{
          'name': "Le chien"
        }]
      },{
        'name': "Question test 2 C'est quoi le plus doux ?",
        'allowAnonymous': false,
        'maxVote': 5,
        'timeout': 45,
        'answers': [{
          'name': "du papier"
        },{
          'name': "de la soie"
        },{
          'name': "de la laine de hamster"
        }]
      }]
    }
  });
});

// Modifier le poll
// Ouvrir le poll (par user1)
// Ajouter des utilisateurs au poll




// Export the scenario for API Copilot to use
module.exports = scenario;
