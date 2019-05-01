const cosmiconfig = require("cosmiconfig");

module.exports = async () => {
    // Load webiny.config.js
    const explorer = cosmiconfig("webiny");
    const res = await explorer.search();
    if(!res) {
        throw new Error("Webiny config file was not found!");
    }
    return res.config;
};
