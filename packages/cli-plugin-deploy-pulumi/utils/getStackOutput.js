const execa = require("execa");
const mapStackOutput = require("./mapStackOutput");
const { getProjectRoot } = require("@webiny/cli/utils");

const getOutputJson = async (stack, env) => {
    try {
        const cwd = getProjectRoot();
        const { stdout } = await execa(
            "yarn",
            ["webiny", "app", "output", stack, "--env", env, "--json", "--no-debug"].filter(
                Boolean
            ),
            {
                cwd
            }
        );

        return JSON.parse(stdout);
    } catch (e) {
        return null;
    }
};

module.exports = async (app, env, map) => {
    if (!app) {
        throw new Error(`Please specify a project application folder, for example "apps/admin".`);
    }

    if (!env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const output = await getOutputJson(app, env);
    if (!output) {
        return output;
    }

    if (!map) {
        return output;
    }

    return mapStackOutput(output, map);
};
