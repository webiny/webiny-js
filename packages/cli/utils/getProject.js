const findUp = require("find-up");
const { dirname } = require("path");
const { importModule } = require("./importModule");

const projectConfigs = ["webiny.js", "webiny.ts"];

function getRoot({ cwd } = {}) {
    let root = findUp.sync(projectConfigs, { cwd });
    if (root) {
        return dirname(root).replace(/\\/g, "/");
    }

    // For backwards compatibility
    root = findUp.sync("webiny.root.js", { cwd });
    if (root) {
        return dirname(root).replace(/\\/g, "/");
    }

    throw new Error("Couldn't detect Webiny project.");
}

function getConfig({ cwd } = {}) {
    let path = findUp.sync(projectConfigs, { cwd });
    if (path) {
        return importModule(path);
    }

    path = findUp.sync("webiny.root.js", { cwd });
    if (path) {
        return require(path);
    }

    throw new Error("Couldn't detect Webiny project.");
}

module.exports = args => {
    const root = getRoot(args);
    return {
        get name() {
            // Check "projectName" for backwards compatibility.
            return process.env.WEBINY_PROJECT_NAME || this.config.projectName || this.config.name;
        },
        root,
        get config() {
            return getConfig(args);
        }
    };
};
