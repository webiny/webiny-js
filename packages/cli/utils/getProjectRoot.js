const findUp = require("find-up");
const path = require("path");

module.exports = () => {
    const webinyRootPath = findUp.sync("webiny.project.js") || findUp.sync("webiny.root.js");
    if (!webinyRootPath) {
        return null;
    }
    return path.dirname(webinyRootPath);
};
