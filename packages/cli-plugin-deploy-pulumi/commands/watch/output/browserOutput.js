const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const Convert = require("ansi-to-html");
const open = require("open");

let server = {
    app: null,
    httpServer: null,
    wss: null,
    connection: null
};

module.exports = {
    type: "watch-output",
    name: "watch-output-browser",
    async initialize(args = {}) {
        return new Promise(resolve => {
            server.app = express();

            server.httpServer = http.createServer(server.app);
            server.wss = new WebSocket.Server({ server: server.httpServer });

            const port = args.port || 3011;
            server.app.get("/", (req, res) => {
                let html = fs.readFileSync(path.join(__dirname, "./browser/panes.html")).toString();
                html = html.replace("{PORT}", String(port));
                res.send(html);
            });

            server.httpServer.listen(port, () => {
                console.log(`Dev server started on port ${port}.`);
                open("http://localhost:" + port);
            });

            server.wss.on("connection", ws => {
                server.connection = ws;
                // Once the connection from the browser has succeeded, finish the initialization process.
                resolve();
            });
        });
    },
    log({ type, message }) {
        if (server.connection) {
            const convert = new Convert({ newline: true });
            server.connection.send(JSON.stringify({ type, message: convert.toHtml(message) }));
        }
    }
};
