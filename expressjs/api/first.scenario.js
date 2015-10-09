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
scenario.step('register a user', function() {
  // make HTTP calls
  return this.post({
    url: '/account',
    body: {
      firstname: 'Paul',
      lastname: 'Finch',
      email: 'asdf@asdf.asdf',
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





// Export the scenario for API Copilot to use
module.exports = scenario;
