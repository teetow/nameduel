function randomizeTwoBabynames() {
    var listOfNames = Babynames.find().fetch();
    var listOfVotes = Votes.find({
        voter: loggedInUser()
    }).fetch();
    var numNames = listOfNames.length;
    if (numNames === 0) {
        console.log("no Babynames in database.");
        return -1;
    }

    var babyOccurrences = getbabyOccurrences(listOfNames, listOfVotes);
    var leftBabyNumId = getWeightedRandomBabyId(babyOccurrences);
    var rightBabyNumId, leftBabyId, rightBabyId;

    if (Babynames.find().count() < 2) {
        return;
    }
    var randomDone = false;
    while (!randomDone) {
        rightBabyNumId = getWeightedRandomBabyId(babyOccurrences);
        leftBabyId = Babynames.findOne(leftBabyNumId);
        rightBabyId = Babynames.findOne(rightBabyNumId);
        if (leftBabyNumId !== rightBabyNumId && leftBabyId.name !== rightBabyId.name) {
            randomDone = true;
        }
    }

    Session.set('leftBabyId', leftBabyId);
    Session.set('leftBabyNumId', leftBabyNumId);
    Session.set('rightBabyId', rightBabyId);
    Session.set('rightBabyNumId', rightBabyNumId);
}

function getbabyOccurrences(listOfNames, listOfVotes) {
    var babyOccurrences = {};
    var numVotes = listOfVotes.length;

    for (var n in listOfNames) {
        var nameObject = listOfNames[n];
        var occurrence = 0;

        for (var v in listOfVotes) {
            var vote = listOfVotes[v];
            if (vote.name == nameObject.name) {
                occurrence += vote.fights;
                break;
            }
        }
        babyOccurrences[nameObject._id] = {
            _id: nameObject._id,
            name: nameObject.name,
            occurrence: occurrence
        };
    }
    return babyOccurrences;
}

function getVotesByUser(votes) {
    var votesByUser = {};
    var votesArray = votes.fetch();

    for (var iVote in votesArray) {
        var vote = votesArray[iVote];

        if (vote.voter in votesByUser) {
            votesByUser[vote.voter].votes.push({
                name: vote.name,
                score: vote.score,
                fights: vote.fights,
                confidence: vote.confidence,
            });
        } else {
            votesByUser[vote.voter] = {
                votes: [{
                    name: vote.name,
                    score: vote.score,
                    fights: vote.fights,
                    confidence: vote.confidence,
                }]
            };
        }
    }
    var totalVotesByUser = [];
    for (var iVoter in votesByUser) {
        var userVotes = votesByUser[iVoter];
        totalVotesByUser.push({
            name: iVoter,
            votes: getAggregatedVotes(userVotes.votes)
        });
    }
    return totalVotesByUser;
}

function getAggregatedVotes(votes) {
    var aggregatedVotes = {};
    for (var iVote in votes) {
        var vote = votes[iVote];
        if (vote.name in aggregatedVotes) {
            aggregatedVotes[vote.name].name = vote.name;
            aggregatedVotes[vote.name].score += vote.score;
            aggregatedVotes[vote.name].fights += vote.fights;
            aggregatedVotes[vote.name].confidence = aggregatedVotes[vote.name].score / aggregatedVotes[vote.name].fights;
        } else {
            aggregatedVotes[vote.name] = {
                name: vote.name,
                score: vote.score,
                fights: vote.fights,
                confidence: vote.confidence
            };
        }
    }
    return aggregatedVotes;
}

function getRandomBabyId(max) {
    return Math.floor(Math.random() * max);
}

function getWeightedRandomBabyId(babyOccurrences) {
    var occs = clone(babyOccurrences);

    // find the max occ value so we can flip them later
    var occMax = 0;
    for (var n in occs) {
        var babyOcc = occs[n].occurrence;

        if (babyOcc > occMax)
            occMax = babyOcc;
    }
    occMax += 1;

    // FLIP ALL THE OCCURRENCES
    for (var n in occs) {
        occs[n].occurrence = occMax - occs[n].occurrence;
    }

    // accumulate total
    var occTotal = 0;
    for (var n in occs) {
        var babyOcc = occs[n].occurrence;
        occTotal += babyOcc;
    }

    // do the actual randomization
    var rnd = getRandomBabyId(occTotal);
    var occAccum = 0;
    for (var n in occs) {
        var baby = occs[n];
        occAccum += baby.occurrence;

        if (occAccum > rnd) {
            /*   console.log(
                 "picked " + baby.name + 
                 " with occurrence " + baby.occurrence + 
                 " \trnd: " + rnd + 
                 " occAccum: " + occAccum
                 );*/
            return baby._id;
        }
    }

    return -1;
}

function renderVotes(cursor, limit) {
    var aggregatedVotes = getAggregatedVotes(cursor.fetch());
    var preparedVotes = getPreparedVotes(aggregatedVotes, limit);
    return preparedVotes;
}

function getPreparedVotes(aggregatedVotes, limit) {
    var preparedVotes = [];

    for (var aggvote in aggregatedVotes) {
        var aggvoteitem = aggregatedVotes[aggvote];

        preparedVotes.push({
            name: aggvoteitem.name,
            fights: aggvoteitem.fights,
            score: aggvoteitem.score,
            confidence: aggvoteitem.confidence,
            width: 100 * aggvoteitem.confidence,
            color: MeterSpectrum.colourAt(aggvoteitem.confidence)
        });
    }

    preparedVotes.sort(function(a, b) {
        if (a.confidence == b.confidence)
            if (a.score == b.score)
                if (a.fights == b.fights)
                    return 0;
                else
                    return b.fights - a.fights;
        else
            return b.score - a.score;
        else
            return b.confidence - a.confidence;
    });

    if (limit > 0) {
        return preparedVotes.slice(0, limit);
    }

    return preparedVotes;
}

function registerWin(winner, loser) {
    var winnername = winner.name;
    var losername = loser.name;
    var votername = loggedInUser();

    registerVote(winnername, 1, votername);
    registerVote(losername, 0, votername);
}

function registerVote(name, score, voter) {
    var existingVote = Votes.findOne({
        name: name,
        voter: voter
    });
    if (!existingVote) {
        Votes.insert({
            name: name,
            score: score,
            voter: voter,
            fights: 1,
            confidence: score
        });
    } else {
        var newConfidence = (existingVote.score + score) / (existingVote.fights + 1);
        Votes.update(existingVote._id, {
            $set: {
                confidence: newConfidence
            },
            $inc: {
                score: score,
                fights: 1
            }
        });
    }
}

function loggedInUser() {
    var loggedinuser = (Meteor.user()) ? Meteor.user().emails[0].address : "anonymous";
    Session.set("loggedinuser", loggedinuser);
    return loggedinuser;
}

function clone(obj) {
    if (obj === null || typeof(obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}
