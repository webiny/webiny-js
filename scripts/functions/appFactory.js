/* eslint-disable */
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const listFunctions = require("./listFunctions");
const expressRequestToLambdaEvent = require("./expressRequestToLambdaEvent");

module.exports = () => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));
    app.all("*", async (req, res, next) => {
        if (req.method !== "OPTIONS") {
            next();
        } else {
            res.set({
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            })
                .status(200)
                .send();
        }
    });

    listFunctions().forEach(fn => {
        app[fn.method.toLowerCase()](fn.path, async function(req, res) {
            require("@babel/register")({
                configFile: path.resolve(process.cwd() + "/babel.config.js"),
                only: [/packages|independent/]
            });

            const { handler } = require(path.join(fn.root, fn.handler));
            const event = expressRequestToLambdaEvent(req);
            const result = await handler(event, { req });
            res.set(result.headers);
            res.status(result.statusCode).send(result.body);
        });
    });

    return app;
};