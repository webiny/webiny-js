const path = require("path");
const execa = require("execa");
const getAppConfig = require("./../utils/getAppConfig");

module.exports = async ({ name }) => {
    const { env } = getAppConfig(name);

    const cwd = path.resolve(`packages/${name}`);
    execa("yarn", ["start"], { cwd, env, stdio: "inherit" });
};
