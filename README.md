# multiplayer-rps
Using Firebase, I created this real-time service for players to log in and challenge each other to games.  Rock-paper-scissors and tic-tac-toe are implemented.  It's built using a modular approach: each game includes (the same) gamebase.js file which handles chat functionality and calls a function within the individual game script when it receives a move from the other player.
