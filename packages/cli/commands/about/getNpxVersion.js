const execa = require("execa");

module.exports.getNpxVersion = async () => {
    try {
        const { stdout } = await execa("npx", ["--version"]);
        return stdout;
    } catch {
        return "";
    }
};
