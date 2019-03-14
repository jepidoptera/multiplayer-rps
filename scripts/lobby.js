// jshint esversion: 6
// jshint multistr: true

class user {
    constructor(name, passwordHash) {
        this.name = name;
        this.passwordHash = passwordHash;
    }
}

// a player is a user who is online and available
class player {
    constructor(username, listItem, key) {
        this.username = username;
        this.listItem = listItem;
        // database key: lj1413325 or some such
        this.key = key;
        this.challenge = null;
        this.game = null;
    }
}

class gameRef {
    constructor(player1, player2, gameName) {
        this.player1 = player1;
        this.player2 = player2;
        // in other words
        this.challenger = player2;
        this.recipient = player1;
        this.gameName = gameName;
    }
}

// a few global variables - maintained by this script, available to others
var localPlayerID = '';
var users = []; // usuers['bob'] = user{name: 'bob', passwordHash: 12454357}
var onlinePlayers = [];
var activeChallenge;
var activeGame;

$(document).ready(() => {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyA-L4Thkk-pasRw4x6yMHdZFIY9Z7h2l3k",
        authDomain: "multiplayer-rps-ac8da.firebaseapp.com",
        databaseURL: "https://multiplayer-rps-ac8da.firebaseio.com",
        projectId: "multiplayer-rps-ac8da",
        storageBucket: "multiplayer-rps-ac8da.appspot.com",
        messagingSenderId: "611363319888"
    };
    firebase.initializeApp(config);

    var usersRef = firebase.database().ref("/users");
    var onlinePlayersRef = firebase.database().ref("/online");
    var localPlayerRef = onlinePlayersRef.push();
    var gamesRef = firebase.database().ref('games');

    // populate users list
    usersRef.on("child_added", (child) => {
        var newUser = child.val();        
        console.log("User in database: ", newUser);
        if (newUser) users[newUser.name] = new user(newUser.name, newUser.passwordHash);
    });
    // they generally won't be removed

    // discover online players
    onlinePlayersRef.on("child_added", function(child) {
        if (child.val().name) addOnlinePlayer(child.val(), child.key);
    });
    // remove players from the list when they leave
    onlinePlayersRef.on("child_removed", child => {
        removeOnlinePlayer(child.val());
    });
    // add/remove players when their status changes (if they join or leave a game)
    onlinePlayersRef.on("child_changed", child => {
        // keep local list up to date
        updateOnlinePlayer(child.val());
        // add/remove/detect events
        if (child.val().busy) {
            removeOnlinePlayer(child.val());
        }
        else {
            addOnlinePlayer(child.val(), child.key);
        }
        // detect challenge/ response
        if (child.val().name == localPlayerID) {
            var challenge = child.val().challenge;
            var game = child.val().game;
            if (challenge != null && game == null) {
                // show challenge dialog
                msgBox("New Challenge", challenge.challenger + " has challenged you to a game of " + 
                {'rps': 'rock-paper-scissors', 'ttt': 'tic-tac-toe'}[challenge.gameName] + ".", 
                dialogButtons([{
                    text: "accept",
                    function: () => {
                        // challenged player goes first
                        challenge.turn = localPlayerID;
                        // promote 'challenge' to 'game'
                        var newgame = firebase.database().ref('games').push(challenge);
                        firebase.database().ref('/online/' + onlinePlayers[localPlayerID].key + '/game').set({id: newgame.key, move: null});
                        // delete challenge
                        firebase.database().ref('/online/' + onlinePlayers[localPlayerID].key + '/challenge').remove();
                        // game doesn't persist after disconnect
                        newgame.onDisconnect().remove();
                        // open game window
                        openGameWindow(challenge.gameName, newgame.key, localPlayerRef.key, onlinePlayers[challenge.challenger].key);
                    }},{
                    text: "decline",
                    function: () => {
                        // delete challenge
                        firebase.database().ref('/online/' + onlinePlayers[localPlayerID].key + '/challenge').remove();
                    }
                }]));
            }
        }
        else if (activeChallenge) {
            // see if opponent responded
            if (child.val().name == activeChallenge.player1) {
                // did they add a game field? that means they joined the game
                if (child.val().game) {
                    // challenge accepted!s
                    activeGame = activeChallenge;
                    activeChallenge = null;
                    // join the game created by opponent
                    firebase.database().ref('online/' + localPlayerRef.key + '/game').set(
                        child.val().game);
                    openGameWindow(activeGame.gameName, child.val().game.id, localPlayerRef.key, child.key);
                }
                // else: did they delete the challenge?
                else if (!child.val().challenge) {
                    // yup. whomp whomp
                    $("#instructions").html('<span style="color:red">' + activeChallenge.player1 + ' declined your challenge.</span>')
                    setTimeout(() => {
                        $("#instructions").html("Click another player's username to issue a game challenge!");
                    }, 10000);
                }
            }
        }
    });
    function addOnlinePlayer(player, key) {
        if (onlinePlayers[player.name]) return;
        player.key = key;
        player.listItem = showOnlinePlayer(player.name);
        console.log("user online: ", player.name);
        // append to list and show html
        onlinePlayers[player.name] = player;
    }
    function removeOnlinePlayer(player) {
        console.log("user offline: ", player.name);
        // delete html
        onlinePlayers[player.name].listItem.remove();
        // delete list reference
        delete onlinePlayers[player.name];
    }
    function updateOnlinePlayer(player) {
        onlinePlayers[player.name].game = player.game;
        onlinePlayers[player.name].challenge = player.challenge;
        onlinePlayers[player.name].busy = player.busy;
    }
    // html list of online players
    function showOnlinePlayer(name) {
        var listItem = $("<li>");
        if (name == localPlayerID) {
            // local player (you)
            listItem.text(name + " (you)");
        } 
        else {
            // remote player (add button to issue challenge)
            listItem.append($("<button>")
                .text(name)
                .addClass("challengeButton")
                .attr("data-opponent", name))
                .click(() => {
                    challengePlayer(name);
                });
        }
        $("#onlinePlayers").append(listItem);
        // return the item so it can be removed when they leave
        return listItem;
    }
    function openGameWindow (gameName, gameID, localPlayerID, opponentID) {
        // reset instructions
        $("#instructions").html("Click another player's username to issue a game challenge!");
        // construct url parameters and open a tab
        var win = window.open(gameName + '.html?' +
        'gameID=' + gameID + 
        '&localPlayer=' + localPlayerID + 
        '&opponent=' + opponentID, '_blank');
        // switch to the new tab
        win.focus();
    }

    // keep track of games (remove when game closed)
    gamesRef.on('child_removed', (child) => {
        if (child.key == onlinePlayers[localPlayerID].game.id) {
            // game was deleted, so delete reference to it
            firebase.database().ref('online/' + localPlayerRef.key + '/game').remove();
        }
    });

    // get username input
    $("#loginForm").submit ((event) => {
        event.preventDefault();
        // is this an existing user?
        localPlayerID = $("#usernameInput").val();
        var password = $("#passwordInput").val();
        if (users[localPlayerID] == null) {
            // this user does not currently exist
            if (password.length < 6) {
                alert ("You're gonna need a better password.  6 character min.");
                return;
            }
            if (!confirm('User "' + localPlayerID + '" does not yet exist.  Create new?')) {
                // cancel; they probably just misspelled their username
                return;
            }
            // create new user in database
            // look at this amazing security.  wow.  ==>
            usersRef.push({name: localPlayerID, passwordHash: password.hashCode()});
        }
        else {
            // user does exist.  check password.
            if (users[localPlayerID].passwordHash != password.hashCode()) {
                // login failed.
                alert ("That password is incorrect.");
                // clear wrong password
                $("#passwordInput").empty();
                return;
            }
            // check if they're already logged in
            if (onlinePlayers[localPlayerID] != undefined) {
                // can't log in twice!
                alert ("You are already logged in somewhere else.");
                return;
            }
            // otherwise, we're logged in now
        }
        
        // hide input form
        $("#loginForm").hide();

        // show lobby screen
        $("#lobbyDiv").show();

        // Add ourselves to list when online
        var connectionRef = firebase.database().ref("/connected");
        connectionRef.on("value", function(snap) {
        if (snap.val()) {
            // remove ourselves when we disconnect
            localPlayerRef.onDisconnect().remove();
            // set reference to current user
            localPlayerRef.set({name: localPlayerID, busy: false});
        }
        });
    });

    // issuing a challenge
    function challengePlayer (opponent) {
        // localPlayer vs opponent @ whatever game they choose here
        msgBox("Select Game", "Please choose a game:", dialogButtons(
            [{text: "rock-paper-scissors", function: () => issueChallenge(opponent, "rps")},
            {text: "tic-tac-toe", function: () => issueChallenge(opponent, "ttt")}]
        ));
    }
    function issueChallenge (opponent, gameName) {
        activeChallenge = new gameRef(opponent, localPlayerID, gameName);
        firebase.database().ref('/online/' + onlinePlayers[opponent].key + "/challenge")
        .set(activeChallenge);
        $("#instructions").text("waiting for " + opponent + " to respond to your challenge.");
    }

    // firebase.auth().signInAnonymously().catch(function(error) {
    //     // Handle Errors here.
    //     var errorCode = error.code;
    //     var errorMessage = error.message;
    //     // ...
    // });
    
    
    // firebase.auth().onAuthStateChanged(function(user) {
    //     if (user) {
    //       // User is signed in.
    //       var isAnonymous = user.isAnonymous;
    //       var uid = user.uid;
    //       var userRef = app.dataInfo.child(app.users);
      
    //       var useridRef = userRef.child(app.userid);
      
    //       var database = firebase.database();
    //       var ref = firebase.database().ref("onlineState");
    //       ref.onDisconnect().set(false);
      
    //       database.ref("/users").on("value", (snapshot) => {
      
    //       });
      
    //       database.ref().on("value", (snapshot) => {
    //           var data = snapshot.val();
    //           if (data.player1 != "" && data.player2 != "") {
    //               alert ("Sorry, this game can only handle two players atm.");
    //               return;
    //           }
      
    //       });
                  
    //     } else {
    //       // User is signed out.
    //       // ...
    //     }
    //     // ...
    // });
});
