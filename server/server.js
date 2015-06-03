Votes = new Meteor.Collection("votes");
Babynames = new Meteor.Collection("babynames");

Meteor.startup(function() {
    Meteor.publish("babynames", function() {
        return Babynames.find();
    });

    Meteor.publish("votes", function() {
        return Votes.find();
    });
});

/*
Votes.allow({
insert: function(userId, vote) {
}
})*/


Votes.allow({
    insert: function(userId, doc) {
        return userId;
    },
    update: function(userId, doc, fields, modifier) {
        // can only change your own documents
        return userId;
    },
    remove: function(userId, doc) {
        // can only remove your own documents
        return doc.userId === userId;
    }
});

Babynames.allow({
    insert: function(userId, doc) {
        return userId;
    },
    update: function(userId, doc, fields, modifier) {
        // can only change your own documents
        return doc.userId === userId;
    },
    remove: function(userId, doc) {
        // can only remove your own documents
        return doc.userId === userId;
    }
});
