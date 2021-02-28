const { green, red } = require("chalk");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");

module.exports = async (inputs, context) => {
    const [, ...command] = inputs._;
    const { env, folder } = inputs;

    await loadEnvVariables(inputs, context);

    await login(folder);

    const pulumi = getPulumi({
        execa: {
            cwd: folder
        }
    });

    if (env) {
        context.info(`Environment provided - selecting ${green(env)} Pulumi stack.`);

        let stackExists = true;
        try {
            await pulumi.run({ command: ["stack", "select", env] });
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(
                `Project application ${red(folder)} (${red(env)} environment) does not exist.`
            );
        }
    }

    context.info(`Running the following command in ${green(folder)} folder:`);
    context.info(`${green("pulumi " + command.join(" "))}`);

    return pulumi.run({
        command,
        execa: { stdio: "inherit" }
    });
};
