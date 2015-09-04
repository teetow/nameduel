function userIsAuthorized() {
    var currentUserEmail = Meteor.user().emails[0].address;
    if (currentUserEmail.indexOf("@domain.com") > -1) {
        return true;
    }
}