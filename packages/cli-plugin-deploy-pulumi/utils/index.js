const getPulumi = require("./getPulumi");
const getStackOutput = require("./getStackOutput");
const processHooks = require("./processHooks");
const notify = require("./notify");
const login = require("./login");
const mapStackOutput = require("./mapStackOutput");
const loadEnvVariables = require("./loadEnvVariables");
const getRandomColorForString = require("./getRandomColorForString");
const { tagResources } = require("./tagResources");

module.exports = {
    getPulumi,
    getStackOutput,
    loadEnvVariables,
    mapStackOutput,
    tagResources,
    processHooks,
    notify,
    login,
    getRandomColorForString
};
