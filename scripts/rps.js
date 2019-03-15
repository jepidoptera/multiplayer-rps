// jshint esversion: 6
var opponentMove;
var yourMove;
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

// called from gameBasics.js when it detects a move via Firebase
function playMove(player, move) {
    if (player == 'opponent') {
        opponentMove = move;
        if (yourMove) {
            resolve();
        }
        else {
            document.getElementById("verbs").textContent = opponentName + " is waiting for your move.";
        }
    }
    else if (player == 'you') {
        yourMove = move;
        // upload move
        // this is the only call back to gameBasics.js which is required (for this game)
        if (!gameover) gameBasics.uploadMove(yourMove);

        if (options.indexOf(yourMove) == -1) {
            console.log ('wtf...');
        }
        else {
            console.log('you move: ', yourMove);
        }
        // remove buttons / show result
        document.getElementById("buttons").style.display = 'none';
        document.getElementById("winner").style.display = 'inline';
        // see who won
        if (opponentMove) {
            resolve();
        }
        else {
            document.getElementById("verbs").textContent = "Waiting for " + opponentName + "...";
        }
    }
}

function resolve() {
    // translate words into numbers
    var weapon = [options.indexOf(yourMove), options.indexOf(opponentMove)];
    var player = [yourName, opponentName, "tie"];
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
    yourName + ": " + yourMove + "<br>" + opponentName + ": " + opponentMove;      
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

function updateTitle() {
    document.getElementById("title").textContent = "Our hero, " + yourName + ", vs. the dastardly " + opponentName + "!";
}

function updateTurn() {
    // nothing to do - but gameBasics expects this function to exist
}

function updateScores() {
    document.getElementById('score').innerHTML = 
    "wins: " + score[0] + 
    "<br>losses: " + score[1] +
    "<br>ties: " + score[2];
}
