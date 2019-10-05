const getEnvironment = require("./getEnvironment");
const createHandler = require("./createHandler");
const promisifyS3ObjectFunction = require("./promisifyS3ObjectFunction");

module.exports = {
    createHandler,
    getEnvironment,
    promisifyS3ObjectFunction
};
