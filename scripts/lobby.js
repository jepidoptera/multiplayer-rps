// jshint esversion: 6
// jshint multistr: true

class user {
    constructor(name, passwordHash, online) {
        this.name = name;
        this.passwordHash = passwordHash;
        this.online = online;
        this.challenge = null;
    }
}

// a player is a user who is online
class player {
    constructor(username, listItem) {
        this.username = username;
        this.listItem = listItem;
    }
}

// finding online players to start a game
$(document).ready(() => {
    var localPlayer = '';
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
    var onlineUsersRef = firebase.database().ref("/online");
    var userRef = onlineUsersRef.push();

    // populate users list
    var users = []; // list<user>
    usersRef.on("child_added", (child) => {
        var newUser = child.val();        
        console.log("User added: ", newUser);
        if (newUser) users[newUser.name] = new user(newUser.name, newUser.passwordHash);
    });

    // discover online players
    var onlinePlayers = []; // list<player>
    onlineUsersRef.on("child_added", function(child) {
        var name = child.val();
        console.log("user online: ", name);
        console.log("# of online users = " + onlinePlayers.length);
        // append to list and show html
        onlinePlayers[name] = new player(name, showOnlinePlayer(child.name));
    });
    // remove players from the list when they leave
    onlineUsersRef.on("child_removed", (child => {
        var name = child.val();
        // delete html
        onlinePlayers[name].listItem.remove();
        // delete list reference
        delete onlinePlayers[name];
    }));

    function showOnlinePlayer(player) {
        var listItem = $("<li>");
        if (player == localPlayer) {
            // local player (you)
            listItem.text(localPlayer + " (you)");
        } 
        else {
            // remote player (add button to issue challenge)
            listItem.append($("<button>").text(player).addClass("challengeButton").attr("data-opponent", snap.val()[player]));
        }
        $("#onlinePlayers").append(listItem);
        return listItem;
    }

    // get username input
    $("#loginForm").submit ((event) => {
        event.preventDefault();
        // is this an existing user?
        localPlayer = $("#usernameInput").val();
        var password = $("#passwordInput").val();
        if (users[localPlayer] == null) {
            // this user does not currently exist
            if (!confirm('User "' + localPlayer + '" does not yet exist.  Create new?')) {
                // cancel; they probably just misspelled their username
                return;
            }
            // create new user in database
            // look at this amazing security.  wow.  ==>
            usersRef.push({name: localPlayer, passwordHash: password.hashCode()});
        }
        else {
            // user does exist.  check password.
            if (users[localPlayer].passwordHash != password.hashCode()) {
                // login failed.
                alert ("That password is incorrect.");
                // clear wrong password
                $("#passwordInput").empty();
                return;
            }
            // check if they're already logged in
            if (users) {}
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
            userRef.onDisconnect().remove();
            // set reference to current user
            userRef.set(localPlayer);
        }
        });
    });

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
