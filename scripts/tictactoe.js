// jshint esversion: 6
var opponentMove;
var yourMove;
var gameOver;

// all the ways to win
var winMatrix = [ 
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

var boxNames = {
    0: 'topLeft',
    1: 'topCenter',
    2: 'topRight',
    3: 'centerLeft',
    4: 'centerCenter',
    5: 'centerRight',
    6: 'bottomLeft',
    7: 'bottomCenter',
    8: 'bottomRight'
};

var score = [0, 0, 0];
var boxes = [];
// set all nine to null (because 'empty' produces a false tie)
for (i = 0; i < 9; i++) {boxes[i] = null;}

window.addEventListener('load', () => {
    // box click events
    Array.from(document.getElementsByClassName('box')).forEach(box => {
        box.onclick = () => {
            playMove('you', box.getAttribute('index'));
        };
    });
    // crude hack - wait for load to (probably) finish
    setTimeout(() => {
        updateTurn();
    }, 500);
});

function resetBoxes () {
    // set all boxes to null
    for (i = 0; i < 9; i++) {
        boxes[i] = null;
        document.getElementById(boxNames[i]).textContent = "";
    }
}

function playMove(player, move) {
    if (gameOver) return;

    console.log(player + " moves at " + move);
    if (player == 'opponent') {
        boxes[move] = 'O';
        document.getElementById(boxNames[move]).textContent = 'O';
        // switch turn
        gameBasics.nextTurn();
    }
    else if (player == 'you') {
        if (turn != yourName) return;
        boxes[move] = 'X';
        document.getElementById(boxNames[move]).textContent = 'X';
        // send move to opponent
        gameBasics.uploadMove(move);
    }
    // check for wins
    checkWins();
}

function checkWins() {
    var winrow = null;
    var winner = null;
    winMatrix.forEach((win) => {
        if (boxes[win[0]] == null) return;
        if (boxes[win[0]] == boxes[win[1]] && boxes[win[1]] == boxes[win[2]]) {
            // winner
            var turnSymbol = document.getElementById(boxNames[win[0]]).textContent;
            winner = (boxes[win[0]] == 'X') ? yourName : opponentName;
            document.getElementById('winner').textContent = "winner: " + winner;
            gameOver = true;
            // make the winning moves blink
            for (i = 0; i < 3; i++) {
                var timeout = i * 500;
                setTimeout(() => {
                    win.forEach((box) => {
                        document.getElementById(boxNames[box]).textContent = '';
                        console.log('blink: ', timeout);
                    });
                }, timeout);
                setTimeout(() => {
                    win.forEach((box) => {
                        document.getElementById(boxNames[box]).textContent = turnSymbol;
                        console.log('unblink: ', timeout);
                    });
                }, timeout + 500);
            }
            setTimeout(() => {
                gameOver = false;
                document.getElementById('winner').textContent = '';
                resetBoxes();
            }, 4000);
            winrow = win;
            return;
        }
    });
    // if every box has something in it, and there is no winner
    if (!winner && 
        boxes.reduce((current, previous) => {return((current && previous));})) {
        // tie
        winner = "tie";
        document.getElementById('winner').textContent = "tie game!";
        setTimeout(() => {
            gameOver = false;
            document.getElementById('winner').textContent = '';
            resetBoxes();
        }, 4000);
    }
    // add up score
    if (winner != null) {
        score[[yourName, opponentName, 'tie'].indexOf(winner)] += 1;
        document.getElementById('score').innerHTML = 
        'SCORE: <br>' + 
        yourName + ": " + score[0] + "<br>" + 
        opponentName + ": " + score[1] + "<br>" +
        'tie: ' + score[2] + "<br>";
    }
    console.log(winner + ' wins with ' + winrow);
    return winrow;
}

function updateTurn() {
    document.getElementById('verbs').textContent = "turn: " + turn;
}

function updateTitle() {
    document.getElementById("title").textContent = "Our hero, " + yourName + ", vs. the dastardly " + opponentName + "!";
}

function updateScores() {
    document.getElementById('score').innerHTML = 
    "wins: " + score[0] + 
    "<br>losses: " + score[1] +
    "<br>ties: " + score[2];
}
