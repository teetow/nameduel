function userIsAuthorized() {
    var authusers = [
    	"boss@coolcompany.com",
    ];

    var currentUserEmail = Meteor.user().emails[0].address;
    var authUserFound = false;
    authusers.forEach(function(item) {
        if (currentUserEmail.indexOf(item) > -1) {
            authUserFound = true;
        }
    });

    return authUserFound;
}
