const { getStateValues } = require("./serverless");
const { buildApi } = require("./bundling/api");
const { buildApp } = require("./bundling/app");
const { buildAppSSR } = require("./bundling/ssr");

module.exports = { buildApi, buildApp, buildAppSSR, getStateValues };
