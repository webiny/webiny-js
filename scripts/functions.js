/* eslint-disable */
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const chalk = require("chalk");
const app = express();
const listFunctions = require("./functions/listFunctions");
const expressRequestToLambdaEvent = require("./functions/expressRequestToLambdaEvent");
const { argv } = require("yargs");

require("@babel/register")({
    configFile: path.resolve(__dirname + "/../babel.config.js"),
    only: [/packages|independent/]
});

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
        const { handler } = require(path.join(fn.root, fn.handler));
        const event = expressRequestToLambdaEvent(req);
        const result = await handler(event, { req });
        res.set(result.headers);
        res.status(result.statusCode).send(result.body);
    });
});

const port = argv.port || 9000;
app.listen(port, () => {
    console.log(chalk.cyan(`🚀 Functions running on port ${port}.`));
});
