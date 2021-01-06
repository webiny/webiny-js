const execa = require("execa");

module.exports = async (stack, env) => {
    try {
        const { stdout } = await execa(
            "webiny",
            ["stack", "output", stack, "--env", env, "--json", "--no-debug"].filter(Boolean)
        );

        return JSON.parse(stdout);
    } catch (e) {
        return null;
    }
};
