// jshint esversion: 6
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

var yourName = "";
var opponentName = "";
var turn;
var yourMoveRef;
var turnRef;

console.log('loaded gameBasics module');
window.addEventListener('load', () => {
    // parse url parameters
    var gameID = getUrlParameter('gameID');
    var localPlayerID = getUrlParameter('localPlayer');
    var opponentID = getUrlParameter('opponent');
    console.log('gameID');

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
    var gamesRef = firebase.database().ref('games');
    var opponentMoveRef = firebase.database().ref('online/' + opponentID + '/game/move');
    yourMoveRef = firebase.database().ref('online/' + localPlayerID + '/game/move');
    var opponentChatRef = firebase.database().ref('online/' + opponentID + '/game/chat');
    var yourChatRef = firebase.database().ref('online/' + localPlayerID + '/game/chat');
    turnRef = firebase.database().ref('games/' + gameID + '/turn');

    // download and show player names
    firebase.database().ref('online/' + localPlayerID).on('value', (player) => {
        yourName = player.val().name;
        updateTitle();
    });
    firebase.database().ref('online/' + opponentID).on('value', (player) => {
        opponentName = player.val().name;
        updateTitle();
    });

    // whose turn is it?
    turnRef.on('value', (value) => {
        turn = value.val();
        updateTurn();
    });

    // game ending - people going offline. notice when this happens
    gamesRef.on('child_removed', (child) => {
        // opponent's window has been closed, probably
        if (child.key == gameID){
            alert('opponent has left the game.');
            gameover = true;
        }
    });
    firebase.database().ref('online').on('child_removed', (player) => {
        if (player.key == localPlayerID || player.key == opponentID) {
            // one of the players left, and the game is over
            alert(player.val().name + ' left the game.');
            gameover = true;
            document.body.style.color = 'gray';
        }
    });

    // delete game when window closes
    window.onunload = () => {
        firebase.database().ref('games/' + gameID).remove();
        window.close();
    };

    // opponent moves
    opponentMoveRef.on('value', (value) => {
        opponentMove = value.val();
        if (opponentMove != null) {
            console.log ('opponent moves: ', opponentMove);
            // this function is defined in the individual game script
            playMove ('opponent', opponentMove);
        }
    });

    // chats (from opponent)
    opponentChatRef.on('value', (value) => {
        var chat = value.val();
        if (chat != null) {
            if (chatContent.innerHTML != "") chatContent.innerHTML += "<br>";
            document.getElementById("chatContent").innerHTML += opponentName + ": " + chat;
            // scroll to bottom to reveal the new chat
            chatContent.scrollTop = chatContent.scrollHeight;
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
        chatContent.innerHTML += yourName + ": " + chat;
        chatContent.scrollTop = chatContent.scrollHeight;
    };
});

gameBasics = {
    // callable by games
    uploadMove: function (move) {
        yourMoveRef.set(move);
    },
    nextTurn: function () {
        turn = (turn == yourName) ? opponentName : yourName;
        console.log ('turn = ' + turn);
        turnRef.set(turn);
    }
}