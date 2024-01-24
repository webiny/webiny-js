const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const Convert = require("ansi-to-html");
const open = require("open");
const { log } = require("@webiny/cli/utils");
const Handlebars = require("handlebars");

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
            let connected = false;

            server.httpServer = http.createServer(server.app);
            server.wss = new WebSocket.Server({ server: server.httpServer });

            const port = args.port || 3011;
            const logs = "remoteRuntimeLogs" in args ? "true" : "false";
            server.app.get("/", (req, res) => {
                const html = fs
                    .readFileSync(path.join(__dirname, "./browser/panes.html"))
                    .toString();
                const template = Handlebars.compile(html);
                res.send(template({ ...args, port, logs }));
            });

            server.httpServer.listen(port, () => {
                const destination = "http://localhost:" + port;
                log.success(`Development server started at %s.`, destination);
                setTimeout(() => {
                    if (!connected) {
                        open(destination);
                    }
                }, 3000);
            });

            server.wss.on("connection", ws => {
                connected = true;
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
