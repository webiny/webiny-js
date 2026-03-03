const findUp = require("find-up");
const path = require("path");
const { loadJsonFileSync } = require("load-json-file");

module.exports = (packageName, { cwd }) => {
    const searchPath = path.join("node_modules", packageName, "package.json");
    const packageJson = findUp.sync(searchPath, { cwd });
    if (packageJson) {
        const { version } = loadJsonFileSync(packageJson);
        return version;
    }
    return null;
};
