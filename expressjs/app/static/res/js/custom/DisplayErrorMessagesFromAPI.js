/*
This factory is used as a helper to format error messages received in response from the REST API
in order to display the returned human readable errors
*/
tweb.factory('DisplayErrorMessagesFromAPI', function () {
    return function(errors) {
		var errorsDescriptions = [];
		
		for (var i=0;i<errors.length;i++) {
			errorsDescriptions.push(errors[i].description);
		}
		
		return errorsDescriptions.join("\n");
	};
});