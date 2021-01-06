const execa = require("execa");
const mapStackOutput = require("./mapStackOutput");
const { getProjectRoot } = require("@webiny/cli/utils");

const getOutputJson = async (stack, env) => {
    try {
        const cwd = getProjectRoot();
        const { stdout } = await execa(
            "webiny",
            ["stack", "output", stack, "--env", env, "--json", "--no-debug"].filter(Boolean),
            {
                cwd
            }
        );

        return JSON.parse(stdout);
    } catch (e) {
        return null;
    }
};

module.exports = async (stack, env, map) => {
    if (!stack) {
        throw new Error(`Please specify stack, for example "apps/admin".`);
    }

    if (!env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const output = await getOutputJson(stack, env);
    if (!output) {
        return output;
    }

    if (!map) {
        return output;
    }

    return mapStackOutput(output, map);
};
