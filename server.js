// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

var webSocketServer = require('websocket').server;
var http = require('http');

// GLOBALS
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];
var userPositions = [];

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// * HTTP server
var server = http.createServer(function (request, response) {
  // Not important for us. We're writing WebSocket server, not HTTP server
});

server.listen(webSocketsServerPort, function () {
  console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

// * WebSocket server
var wsServer = new webSocketServer({
  httpServer: server
});

// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function (request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

  // accept connection - you should check 'request.origin' to make sure that client is connecting from your website
  var connection = request.accept(null, request.origin);

  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  var userName = false;
  var userCharacter = "firefox";
  var userAnimation = "walk_right";
  var userWidth = 32;
  var userHeight = 32;
  var userAnimationRow = 0;


  console.log((new Date()) + ' Connection accepted.');

  // send back chat history for the first time
  if (history.length > 0) {
    connection.sendUTF(JSON.stringify({type: 'history', data: history}));
  }

  // user sent some message
  connection.on('message', function (message) {
    if (message.type === 'utf8') { // accept only text

      var NewMessage = JSON.parse(message.utf8Data);

      if (NewMessage.type === "join") {
        userName = htmlEntities(NewMessage.userName);
        userCharacter = htmlEntities(NewMessage.userCharacter);
        userAnimation = htmlEntities(NewMessage.userAnimation);
        userWidth = NewMessage.userWidth;
        userHeight = NewMessage.userHeight;

        userPositions[index] = {
          userName: userName,
          userCharacter: userCharacter,
          userAnimation: userAnimation,
          userWidth: userWidth,
          userHeight: userHeight,
          animation_row : NewMessage.animation_row,
          animation_frame : 0,
          animation_max_frame : NewMessage.animation_max_frame,
          posX: Math.floor(Math.random() * 450),
          posY: Math.floor(Math.random() * 150)
        };

        connection.sendUTF(JSON.stringify({type: 'new_user', userPosition: userPositions[index]}));

        console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userCharacter + '. At X' + userPositions[index].posX + ", Y: " + userPositions[index].posY);

        var obj = {
          time: (new Date()).getTime(),
          type: "serverMessage",
          message: htmlEntities("User " + userName + " joined conversation."),
        };

        history.push(obj);

        // broadcast message to all connected clients
        var json = JSON.stringify({type: 'message', data: obj});
        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }

        var json = JSON.stringify({type: 'positions', data: userPositions});
        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }

      else if (NewMessage.type === "userPosition") {
        if (typeof  userPositions[index] !== "undefined") {
          userPositions[index].posX = parseInt(NewMessage.posX);
          userPositions[index].posY = parseInt(NewMessage.posY);

          console.log((new Date()) + ' User known as: ' + userName + ' moved to X' + userPositions[index].posX + ", Y: " + userPositions[index].posY);

          var json = JSON.stringify({type: 'positions', data: userPositions});
          for (var i = 0; i < clients.length; i++) {
            clients[i].sendUTF(json);
          }
        }
      }

      else if (NewMessage.type === "textMessage") {
        // log and broadcast the message
        console.log((new Date()) + ' Received Message from ' + userName + ': ' + NewMessage.message);

        // we want to keep history of all sent messages
        var obj = {
          time: (new Date()).getTime(),
          type: "userMessage",
          message: htmlEntities(NewMessage.message),
          author: userName,
        };

        history.push(obj);
        history = history.slice(-100);

        // broadcast message to all connected clients
        var json = JSON.stringify({type: 'message', data: obj});
        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }
    }
  });

  // user disconnected
  connection.on('close', function (connection) {
    if (userName !== false ) {
      console.log((new Date()) + " Peer from " + connection.remoteAddress + " with name " + userName + " disconnected.");

      var obj = {
        time: (new Date()).getTime(),
        type: "serverMessage",
        message: htmlEntities("User " + userName + " has left the conversation."),
      };

      history.push(obj);

      // broadcast message to all connected clients
      var json = JSON.stringify({type: 'message', data: obj});
      for (var i = 0; i < clients.length; i++) {
        clients[i].sendUTF(json);
      }


      // remove user from the list of connected clients
      // clients.splice(index, 1);
      // userPositions.splice(index, 1);
    }
  });

});