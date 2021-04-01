const findUp = require("find-up");
const path = require("path");

module.exports = args => {
    const getProjectRoot = getProjectRoot(args);
    const config = getProjectConfig(args);

    return {
        // "projectName" because of the backwards compatibility.
        name: config.projectName || config.name,
        root: getProjectRoot(args),
        config
    };
};

function getProjectRoot({ cwd } = {}) {
    let root = findUp.sync("webiny.project.js", { cwd });
    if (root) {
        return path.dirname(root);
    }

    root = findUp.sync("webiny.root.js", { cwd });
    if (root) {
        return path.dirname(root);
    }

    throw new Error("Couldn't detect Webiny project.");
}

function getProjectConfig({ cwd } = {}) {
    let path = findUp.sync("webiny.project.js", { cwd });
    if (path) {
        return require(path);
    }

    path = findUp.sync("webiny.root.js", { cwd });
    if (path) {
        return require(path);
    }

    throw new Error("Couldn't detect Webiny project.");
}
