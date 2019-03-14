// jshint esversion: 6
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
var gameID;
var localPlayer = "";
var localPlayerID;
var opponent = "";
var opponentID;
var opponentMove;
var opponentMoveRef;
var opponentChatRef;
var yourMove;
var yourMoveRef;
var yourChatRef;
var gameRef;
var gameover;

var options = [
    "rock",
    "paper",
    "scissors"
];

// extra-large in case I decide to go for lizard-spock
var winMatrix = [
    [-1, 1, 0, 1, 0],
    [0, -1, 1, 0, 1],
    [1, 0, -1, 1, 0],
    [0, 1, 0, -1, 1],
    [1, 0, 1, 0, -1]
];

var score = [0, 0, 0];

window.onload = () => {
    // parse url parameters
    gameID = getUrlParameter('gameID');
    localPlayerID = getUrlParameter('localPlayer');
    opponentID = getUrlParameter('opponent');

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

    // setup listeners
    gameRef = firebase.database().ref('games/' + gameID);
    opponentMoveRef = firebase.database().ref('online/' + opponentID + '/game/move');
    yourMoveRef = firebase.database().ref('online/' + localPlayerID + '/game/move');
    opponentChatRef = firebase.database().ref('online/' + opponentID + '/game/chat');
    yourChatRef = firebase.database().ref('online/' + localPlayerID + '/game/chat');

    // download and show player names
    firebase.database().ref('online/' + localPlayerID).on('value', (player) => {
        localPlayer = player.val().name;
        updateBanner();
    });
    firebase.database().ref('online/' + opponentID).on('value', (player) => {
        opponent = player.val().name;
        updateBanner();
    });

    // game ending - people going offline. notice when this happens
    gameRef.on('child_removed', (child) => {
        // opponent's window has been closed, probably
        if (child.key == gameID){
            alert('opponent has left the game.');
            gameover = true;
        }
    });
    firebase.database().ref('online').on('child_removed', (player) => {
        if (player.key == localPlayerID || player.key == opponentID) {
            // one of the players left, and the game is over
            alert('a player left the game.');
            gameover = true;
        }
    });

    // delete game when window closes
    window.onunload = () => {
        gameRef.remove();
        window.close();
    };

    // opponent moves
    opponentMoveRef.on('value', (value) => {
        opponentMove = value.val();
        if (opponentMove != null) {
            console.log ('opponent moves: ', opponentMove);
            if (yourMove) {
                resolve();
            }
            else {
                document.getElementById("verbs").textContent = opponent + " is waiting for your move.";
            }
        }
    });

    // chats (from opponent)
    opponentChatRef.on('value', (value) => {
        var chat = value.val();
        if (chat != null) {
            if (chatContent.innerHTML != "") chatContent.innerHTML += "<br>";
            document.getElementById("chatContent").innerHTML += opponent + ": " + chat;
        }
    });
    // submit chat (on your end)
    document.getElementById("chatEnter").onsubmit = (event) => {
        event.preventDefault();
        var chat = document.getElementById('chatInput').value;
        // clear input field
        document.getElementById('chatInput').value = "";
        // send off to server
        yourChatRef.set(chat);
        var chatContent = document.getElementById("chatContent");
        // show
        console.log(chatContent.innerHTML);
        if (chatContent.innerHTML != "") chatContent.innerHTML += "<br>";
        chatContent.innerHTML += localPlayer + ": " + chat;
        chatContent.scrollTop = chatContent.scrollHeight;
    };
};

// your move
function move(move) {
    yourMove = move;
    if (options.indexOf(move) == -1) {
        console.log ('wtf...');
    }
    else {
        console.log('you move: ', move);
    }
    // remove buttons / show result
    document.getElementById("buttons").style.display = 'none';
    document.getElementById("winner").style.display = 'inline';
    // upload move
    if (!gameover) yourMoveRef.set(move);
    // see who won
    if (opponentMove) {
        resolve();
    }
    else {
        document.getElementById("verbs").textContent = "Waiting for " + opponent + "...";
    }
}

function resolve() {
    // translate words into numbers
    var weapon = [options.indexOf(yourMove), options.indexOf(opponentMove)];
    var player = [localPlayer, opponent, "tie"];
    switch (winMatrix[weapon[0]][weapon[1]]) {
    case -1:
        // tie
        winner = 2; break;
    case 0:
        // you win
        winner = 0; break;
    case 1:
        // opponent 
        winner = 1; break;
    }
    // show moves side by side
    document.getElementById("verbs").innerHTML = 
    localPlayer + ": " + yourMove + "<br>" + opponent + ": " + opponentMove;      
    document.getElementById("winner").textContent = "winner: " + player[winner];  
    // reset moves
    yourMove = null;
    opponentMove = null;
    yourMoveRef.set(null);
    // update score
    score[winner]++;
    updateScores();
    // after a few seconds, reset
    setTimeout(() => {
        document.getElementById("buttons").style.display = 'inline';
        document.getElementById("winner").style.display = 'none';
        document.getElementById("verbs").textContent = "";
        document.getElementById("winner").textContent = "";

    }, 3000);
}

function updateBanner() {
    document.getElementById("title").textContent = "Our hero, " + localPlayer + ", vs. the dastardly " + opponent + "!";
}

function updateScores() {
    document.getElementById('score').innerHTML = 
    "wins: " + score[0] + 
    "<br>losses: " + score[1] +
    "<br>ties: " + score[2];
}
