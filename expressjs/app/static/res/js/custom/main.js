var tweb = angular.module('tweb', ['ngRoute', 'ngAnimate', 'chart.js', 'ui.gravatar']);

tweb.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'res/partials/home.html',
                    controller: 'home'
                }).
                when('/login', {
                    templateUrl: 'res/partials/login.html',
                    controller: 'login'
                }).
				when('/polls', {
                    templateUrl: 'res/partials/polls.html',
                    controller: 'polls'
                }).
				when('/join', {
                    templateUrl: 'res/partials/join.html',
                    controller: 'join'
                }).
				when('/register', {
                    templateUrl: 'res/partials/register.html',
                    controller: 'register'
                }).
				when('/polldetails', {
                    templateUrl: 'res/partials/polldetails.html',
                    controller: 'polldetails'
                }).
				when('/polljoin', {
                    templateUrl: 'res/partials/polljoin.html',
                    controller: 'polljoin'
                }).
				when('/pollspeaker', {
                    templateUrl: 'res/partials/pollspeaker.html',
                    controller: 'pollspeaker'
                }).
				when('/pollaudience', {
                    templateUrl: 'res/partials/pollaudience.html',
                    controller: 'pollaudience'
                }).
				when('/pollview', {
                    templateUrl: 'res/partials/pollview.html',
                    controller: 'pollview'
                }).
				when('/changepassword', {
                    templateUrl: 'res/partials/changepassword.html',
                    controller: 'changepassword'
                }).
                otherwise({
                    redirectTo: '/login'
                });
        }]);

/*
spp: Reference to the shared ServerPushPoll factory
session: User session obtained from the server
pollIdToJoin: id of the poll you want to join
cbAsSpeaker: callback to execute when the server decides to make you join as a speaker
cbAsAudience: callback to execute when the server decides to make you join as an audience member
*/
function socketIOConnectToServer(spp, session, pollIdToJoin, cbAsSpeaker, cbAsAudience) {
	spp.connect(null, null, session, pollIdToJoin,
	            cbAsSpeaker, cbAsAudience);
}

