const { red } = require("chalk");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");

module.exports = async (inputs, context) => {
    const { env, folder, json } = inputs;
    const projectApplicationDir = path.join(".", folder).replace(/\\/g, "/");

    await loadEnvVariables(inputs, context);

    await login(folder, context.paths.projectRoot);

    const pulumi = getPulumi({
        execa: {
            cwd: projectApplicationDir
        }
    });

    let stackExists = true;
    try {
        await pulumi.run({ command: ["stack", "select", env] });
    } catch (e) {
        stackExists = false;
    }

    if (stackExists) {
        return pulumi.run({
            command: ["stack", "output"],
            args: {
                json
            },
            execa: { stdio: "inherit" }
        });
    }

    if (json) {
        return console.log(JSON.stringify(null));
    }

    context.error(`Project application ${red(folder)} (${red(env)} environment) does not exist.`);
};
