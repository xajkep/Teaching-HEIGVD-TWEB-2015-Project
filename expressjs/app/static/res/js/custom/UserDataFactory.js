/*
This factory is used to store data that is shared accross controllers
*/
tweb.factory('UserDataFactory', function () {
	
	// The session attribute is the session obtained from the server
    var userData = {
        session: null
    };
	
    return {
		getSession: function() {
			return userData.session;
		},
		setSession: function(pSession) {
			userData.session = pSession;
		}
	}
});