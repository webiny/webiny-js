const execa = require("execa");
const { getProject } = require("@webiny/cli/utils");

const cache = {};
const getOutputJson = ({ folder, env, cwd }) => {
    const project = getProject();

    if (cache[folder + env]) {
        return cache[folder + env];
    }

    try {
        const command = ["webiny", "pulumi", folder, "--env", env, "--", "stack", "export"];

        const { stdout } = execa.sync("yarn", command.filter(Boolean), {
            cwd: cwd || project.root
        });

        return JSON.parse(stdout);
    } catch (e) {
        return null;
    }
};

module.exports = args => {
    if (!args.folder) {
        throw new Error(`Please specify a project application folder, for example "apps/admin".`);
    }

    if (!args.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    return getOutputJson(args);
};
