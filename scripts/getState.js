const PROJECT_FOLDER = ".";
const loadJson = require("load-json-file");
const path = require("path");

module.exports = (stack, env = "dev") => {
    const statePath = path.resolve(
        PROJECT_FOLDER,
        path.join(".webiny", "state", stack, env, "Webiny.json")
    );
    return loadJson.sync(statePath);
};
