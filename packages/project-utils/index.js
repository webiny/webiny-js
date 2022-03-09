const { createWatchApp, createBuildApp } = require("./bundling/app");
const {
    createBuildFunction,
    createWatchFunction,
    buildLambdaEdge
} = require("./bundling/function");
const { createWatchPackage, createBuildPackage } = require("./packages");

module.exports = {
    createBuildApp,
    createWatchApp,

    // Functions.
    createBuildFunction,
    createWatchFunction,
    buildLambdaEdge,

    // Packages.
    createWatchPackage,
    createBuildPackage
};
