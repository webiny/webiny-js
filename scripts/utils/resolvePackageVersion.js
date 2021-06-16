const findUp = require("find-up");
const loadJsonFile = require("load-json-file");
const path = require("path");

module.exports = (packageName, { cwd }) => {
    const searchPath = path.join("node_modules", packageName, "package.json");
    const packageJson = findUp.sync(searchPath, { cwd });
    if (packageJson) {
        const { version } = loadJsonFile.sync(packageJson);
        return version;
    }
    return null;
};
