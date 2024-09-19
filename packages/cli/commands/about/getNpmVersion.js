const execa = require("execa");

module.exports.getNpmVersion = async () => {
    try {
        const { stdout } = await execa("npm", ["--version"]);
        return stdout;
    } catch {
        return "";
    }
};
