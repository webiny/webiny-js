/* eslint-disable */
const express = require("express");
const get = require("lodash.get");
const bodyParser = require("body-parser");
const path = require("path");
const listFunctions = require("./listFunctions");
const expressRequestToLambdaEvent = require("./expressRequestToLambdaEvent");

const handleRequest = async (req, res, handler) => {
    const event = expressRequestToLambdaEvent(req);
    const result = await handler(event, { req });
    res.set(result.headers);
    res.status(result.statusCode).send(result.body);
};

module.exports = async config => {
    require("@babel/register")({ only: [/packages/] });

    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));
    app.all("*", async (req, res, next) => {
        if (req.method !== "OPTIONS") {
            return next();
        }

        res.set({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        })
            .status(200)
            .send();
    });

    app.get("/files/:key", async (req, res) => {
        const { handler } = require("./fileHandlers/download");
        await handleRequest(req, res, handler);
    });

    app.post("/files", async (req, res) => {
        const { handler } = require("./fileHandlers/uploadRequest");
        await handleRequest(req, res, handler);
    });

    app.post("/files/upload", async (req, res) => {
        const { handler } = require("./fileHandlers/upload");
        await handleRequest(req, res, handler);
    });

    const functions = await listFunctions();

    functions.forEach(fn => {
        app[fn.method.toLowerCase()](fn.path, async (req, res) => {
            const env = get(config, `functions.${fn.package.name}.env`, {});

            const vars = Object.keys(env);
            vars.forEach(key => {
                process.env[key] = env[key];
            });

            const { handler } = require(path.join(fn.root, fn.handler));
            await handleRequest(req, res, handler);
        });
    });

    return app;
};
