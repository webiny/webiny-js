const findUp = require("find-up");
const path = require("path");

module.exports = () => {
    const webinyRootPath = findUp.sync("webiny.root.js");
    return path.dirname(webinyRootPath);
};
