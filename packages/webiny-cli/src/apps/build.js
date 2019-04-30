const path = require("path");
const execa = require("execa");
const cosmiconfig = require("cosmiconfig");

module.exports = async ({ name }) => {
    // Load webiny.config.js
    const explorer = cosmiconfig("webiny");
    const { config } = await explorer.search();
    
    const cwd = path.resolve(`packages/${name}`);
    const { env } = config.apps[name];

    execa("yarn", ["build"], { cwd, env, stdio: "inherit" });
};
