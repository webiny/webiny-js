/* eslint-disable */
const { argv } = require("yargs");
const path = require("path");
const express = require("express");

const port = process.env.PORT || argv.port || 9000;

// We need to set this variable for Apollo Client
process.env["REACT_APP_API_HOST"] = "http://localhost:" + port;

// Run functions
const logFunctions = require("./functions/logFunctions");
const appFactory = require("./functions/appFactory");
const expressRequestToLambdaEvent = require("./functions/expressRequestToLambdaEvent");

logFunctions();

// Run express
const appRoot = path.join(process.cwd(), argv._[0]);

const { handler } = require(path.join(appRoot, "build/ssr"));

const app = appFactory();
app.use("/static", express.static(path.join(appRoot, "build/static"), { index: false }));

app.use(async (req, res, next) => {
    if (req.url.includes(".")) {
        return next();
    }

    const html = await handler(expressRequestToLambdaEvent(req));
    res.status(200);
    res.send(html);
    res.end();
});

app.listen(port, () => {
    console.log(`Server listening on ${port} port`);
});
