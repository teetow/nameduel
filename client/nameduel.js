Votes = new Meteor.Collection("votes");
Babynames = new Meteor.Collection("babynames");
MeterSpectrum = new Rainbow();

Meteor.startup(function() {
    console.log("client startup...");

    // set up color gradient for meters
    MeterSpectrum.setSpectrum("FF8F8C", "FFCC61", "A4DE5F");
    MeterSpectrum.setNumberRange(0, 1);

    // subscribe to babynames      
    Meteor.subscribe("babynames", function() {
        Session.set("babynamesready", true);
        console.log("babynames ready...");
    });

    // subscribe to votes
    Meteor.subscribe("votes", function() {
        Session.set("votesready", true);
        console.log("votes ready...");
        randomizeTwoBabynames();
    });
});

Template.babyleft.helpers({
    baby: function() {
        return Session.get('leftBabyId');
    },
});

Template.babyright.helpers({
    baby: function() {
        return Session.get('rightBabyId');
    },
});

Template.votewidget.helpers({
    canAddNames: function() {
        return userIsAuthorized();
    }
});

Template.toplists.helpers({
    popularNames: function() {
        var foundVotes = Votes.find();
        var renderFull = Session.equals("popularfull", true);
        return renderVotes(foundVotes, (renderFull) ? 0 : 4);
    },
    favoriteNames: function() {
        var foundVotes = Votes.find({
            voter: loggedInUser()
        });
        var renderFull = Session.equals("favoritesfull", true);
        return renderVotes(foundVotes, (renderFull) ? 0 : 4);
    },
    favoriteslistfull: function() {
        return (Session.equals("favoritesfull", true)) ? 'full' : "";
    },
    popularlistfull: function() {
        return (Session.equals("popularfull", true)) ? 'full' : "";
    },
    showPopularNames: function() {
        return userIsAuthorized();
    },
});

Template.babyleft.events({
    'click .babyvotebox': function() {
        registerWin(Session.get("leftBabyId"), Session.get("rightBabyId"));
        randomizeTwoBabynames();
    }
});

Template.babyright.events({
    'click .babyvotebox': function() {
        registerWin(Session.get("rightBabyId"), Session.get("leftBabyId"));
        randomizeTwoBabynames();
    }
});

Template.skipvote.events({
    'click .skipvote': function() {
        randomizeTwoBabynames();
    }
});

Template.addwidget.onCreated(function() {
    this.isValidName = new ReactiveVar(false);
});

Template.addwidget.events({
    "click .addwidget-button": function(event, template) {
        if (!template.isValidName.get()) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        var newNameRaw = template.$(".addwidget-input").val().trim();
        var newName = newNameRaw.replace(/(<([^>]+)>)/ig, "");
        Babynames.insert({
            name: newName
        });
        template.$(".message").html(newName + " added!");
        template.$(".message").show();
        randomizeTwoBabynames();
        template.$(".message").fadeOut(3000);
    },
    "keydown .addwidget-input": function(event, template) {
        if (event.which == 13) {
            event.preventDefault();
            event.stopPropagation();
            template.$(".addwidget-button").click();
            $(event.target).val("");
            template.isValidName.set(false);
        }
    },
    "input .addwidget-input, paste .addwidget-input": function(event, template) {
        event.preventDefault();
        event.stopPropagation();
        template.isValidName.set(template.$(".addwidget-input").val().trim() !== "");
    }
});

Template.addwidget.helpers({
    "isValidName": function() {
        if (Template.instance().isValidName.get()) {
            return false;
        } else return "disabled";
    }
});

Template.toplists.events({
    'click .favoriteslistbox h4': function() {
        var currentState = Session.get("favoritesfull");
        if (currentState === null)
            Session.set("favoritesfull", true);
        else
            Session.set("favoritesfull", !currentState);
    },
    'click .popularlistbox h4': function() {
        var currentState = Session.get("popularfull");
        if (currentState === null)
            Session.set("popularfull", true);
        else
            Session.set("popularfull", !currentState);
    }
});
