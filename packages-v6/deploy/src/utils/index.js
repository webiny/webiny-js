const getPulumi = require("packages/deploy/deployApi/utils/getPulumi");
const getStackOutput = require("packages/deploy/deployApi/utils/getStackOutput");
const crawlDirectory = require("packages/deploy/deployApi/utils/crawlDirectory");
const processHooks = require("./processHooks");
const notify = require("./notify");
const login = require("packages/deploy/deployApi/utils/login");
const mapStackOutput = require("./mapStackOutput");
const loadEnvVariables = require("packages/deploy/deployApi/utils/loadEnvVariables");
const getRandomColorForString = require("packages/deploy/deployApi/utils/getRandomColorForString");
const { tagResources } = require("./tagResources");

module.exports = {
    getPulumi,
    getStackOutput,
    crawlDirectory,
    loadEnvVariables,
    mapStackOutput,
    tagResources,
    processHooks,
    notify,
    login,
    getRandomColorForString
};
