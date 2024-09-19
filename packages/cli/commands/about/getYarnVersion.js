const execa = require("execa");

module.exports.getYarnVersion = async () => {
    try {
        const { stdout } = await execa("yarn", ["--version"]);
        return stdout;
    } catch {
        return "";
    }
};
