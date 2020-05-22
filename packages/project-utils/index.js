const { getStateValues, updateEnvValues } = require("./serverless");
const { buildFunction } = require("./bundling/function");
const { startApp, buildApp } = require("./bundling/app");
const { buildAppHandler, buildAppHandlerWithSSR } = require("./bundling/appHandler");
const { buildAppSSR, buildAppSSRFromSource } = require("./bundling/ssr");

module.exports = {
    buildApp,
    buildAppHandler,
    buildAppHandlerWithSSR,
    startApp,
    buildAppSSR,
    buildAppSSRFromSource,
    buildFunction,
    getStateValues,
    updateEnvValues
};
