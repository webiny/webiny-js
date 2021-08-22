const { importModule } = require("./importModule");
const getProject = require("./getProject");
const getProjectApplication = require("./getProjectApplication");
const localStorage = require("./localStorage");
const globalConfig = require("./globalConfig");
const log = require("./log");
const getVersion = require("./getVersion");
const PluginsContainer = require("./PluginsContainer");

module.exports = {
    importModule,
    getProject,
    getProjectApplication,
    localStorage,
    globalConfig,
    log,
    getVersion,
    PluginsContainer

    // "sendEvent" wasn't exported on purpose. It's an internal helper function, so let's
    // directly import it in our code, and avoid needlessly exposing it to regular users.
};
