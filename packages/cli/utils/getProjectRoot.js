const findUp = require("find-up");
const path = require("path");

module.exports = ({ cwd } = {}) => {
    const webinyRootPath =
        findUp.sync("webiny.project.js", { cwd }) || findUp.sync("webiny.root.js", { cwd });
    if (!webinyRootPath) {
        return null;
    }
    return path.dirname(webinyRootPath);
};
