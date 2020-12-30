const { buildFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");
const { buildAppHandler } = require("./bundling/appHandler");

module.exports = {
    buildApp,
    buildAppHandler,
    startApp,
    buildFunction
};
