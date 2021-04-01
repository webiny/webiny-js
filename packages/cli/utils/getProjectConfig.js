const findUp = require("find-up");

module.exports = () => {
    const path = findUp.sync("webiny.project.js") || findUp.sync("webiny.root.js");
    return require(path);
};
