const execa = require("execa");

module.exports = async () => {
    try {
        const { stdout } = await execa("npm", ["--version"]);
        return stdout;
    } catch (err) {
        return "";
    }
};
