const findUp = require("find-up");
const { dirname } = require("path");
const { importModule } = require("./importModule");

const projectConfigs = ["webiny.project.js", "webiny.project.ts"];

function getRoot({ cwd } = {}) {
    let root = findUp.sync(projectConfigs, { cwd });
    if (root) {
        return dirname(root);
    }

    // For backwards compatibility
    root = findUp.sync("webiny.root.js", { cwd });
    if (root) {
        return dirname(root);
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
    const config = getConfig(args);
    return {
        // "projectName" because of the backwards compatibility.
        name: config.projectName || config.name,
        root,
        config
    };
};
