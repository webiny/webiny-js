const execa = require("execa");
const mapStackOutput = require("./mapStackOutput");
const { getProject } = require("@webiny/cli/utils");

const cache = {};
const getOutputJson = ({ folder, env, cwd }) => {
    const project = getProject();

    if (cache[folder + env]) {
        return cache[folder + env];
    }

    try {
        const { stdout } = execa.sync(
            "yarn",
            ["webiny", "output", folder, "--env", env, "--json", "--no-debug"].filter(Boolean),
            {
                cwd: cwd || project.root
            }
        );

        // Let's get the output after the first line break. Everything before is just yarn stuff.
        const extractedJSON = stdout.substring(stdout.indexOf("{"));
        cache[folder + env] = JSON.parse(extractedJSON);
        return cache[folder + env];
    } catch (e) {
        return null;
    }
};

module.exports = (folderOrArgs, env, map) => {
    if (!folderOrArgs) {
        throw new Error("Missing initial argument.");
    }

    // Normalize arguments.
    let args = {};
    if (typeof folderOrArgs === "string") {
        args = {
            folder: folderOrArgs,
            env: env,
            map: map
        };
    } else {
        args = folderOrArgs;
    }

    if (!args.folder) {
        throw new Error(`Please specify a project application folder, for example "apps/admin".`);
    }

    if (!args.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const output = getOutputJson(args);
    if (!output) {
        return output;
    }

    if (!args.map) {
        return output;
    }

    return mapStackOutput(output, args.map);
};
