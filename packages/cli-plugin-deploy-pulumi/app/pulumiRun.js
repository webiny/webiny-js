const { green } = require("chalk");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");

module.exports = async (inputs, context) => {
    const [, ...commandArray] = inputs._;
    const { env, folder } = inputs;

    const stacksDir = path.join(".", folder).replace(/\\/g, "/");

    await loadEnvVariables(inputs, context);

    await login(folder);

    const pulumi = getPulumi({
        execa: {
            cwd: stacksDir
        }
    });

    const command = commandArray.join(" ");
    context.info(
        `Running the following command in ${green(stacksDir)} folder (${green(env)} environment):`
    );
    context.info(`${green("pulumi " + command)}`);

    return pulumi.run({
        command: commandArray,
        execa: { stdio: "inherit" }
    });
};
