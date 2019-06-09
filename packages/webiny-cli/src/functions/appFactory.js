/* eslint-disable */
const express = require("express");
const get = require("lodash.get");
const bodyParser = require("body-parser");
const path = require("path");
const listPackages = require("../utils/listPackages");
const expressRequestToLambdaEvent = require("../utils/expressRequestToLambdaEvent");

const getHandler = async ({ createHandler, handler }) => {
    return async (event, context) => {
        if (typeof handler !== "function") {
            handler = await createHandler(context);
        }

        const data = await handler(event, context);

        /**
         * This section simply beautifies the response for readability, useful when
         * debugging things from your browser.
         */
        if (data.headers["Content-Type"] === "application/json") {
            data.body = JSON.stringify(JSON.parse(data.body), null, 2);
        }

        data.headers = {
            ...data.headers,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        };

        return data;
    };
};

const handleRequest = async (req, res, handler) => {
    const event = expressRequestToLambdaEvent(req);
    const context = { req };

    const result = await handler(event, context);
    res.set(result.headers);
    res.status(result.statusCode).send(result.body);
};

module.exports = async config => {
    process.env.WEBINY_DEV = "true";

    require("@babel/register")({
        only: [/packages/],
        configFile: path.resolve("babel.config.js")
    });

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

    const functions = await listPackages("function");

    functions.forEach(fn => {
        app[fn.method.toLowerCase()](fn.path, async (req, res) => {
            const env = get(config, `functions.${fn.package.name}.env`, {});

            const vars = Object.keys(env);
            vars.forEach(key => {
                process.env[key] = env[key];
            });

            const userHandler = require(path.join(fn.root, fn.handler));
            const handler = await getHandler(userHandler);
            await handleRequest(req, res, handler);
        });
    });

    return app;
};
