const PROJECT_FOLDER = ".";
const loadJson = require("load-json-file");
const path = require("path");

module.exports = (stack, env = "prod") => {
    const statePath = path.resolve(
        PROJECT_FOLDER,
        path.join(".webiny", "state", stack, env, "Webiny.json")
    );

    try {
        return loadJson.sync(statePath);
    } catch (e) {
        throw new Error(
            `Failed to deployment state files from "${statePath}", for "${env}" environment. Does the environment exist?`
        );
    }
};
