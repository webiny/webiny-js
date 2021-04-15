const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    //connection is up, let's add a simple simple event
    ws.on("message", message => {
        //log the received message and send it back to the client
        console.log("received: %s", message);
        ws.send(`Hello, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection
    ws.send("Hi there, I am a WebSocket server");

    setInterval(() => {
        ws.send("kobaja" + new Date().toISOString());
    }, 2500);
});

//start our server
server.listen(process.env.PORT || 3010, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});
