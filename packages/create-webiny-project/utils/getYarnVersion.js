const execa = require("execa");

module.exports = async () => {
    try {
        const { stdout } = await execa("yarn", ["--version"]);
        return stdout;
    } catch {
        return "";
    }
};
