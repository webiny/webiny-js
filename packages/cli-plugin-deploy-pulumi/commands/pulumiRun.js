const path = require("path");
const { red } = require("chalk");
const { login, getPulumi, loadEnvVariables } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");

module.exports = async (inputs, context) => {
    const [, ...command] = inputs._;
    const { env, folder, debug } = inputs;

    const cwd = process.cwd();

    await loadEnvVariables(inputs, context);

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(cwd, inputs.folder)
    });

    await login(projectApplication);

    const pulumi = await getPulumi({
        folder: inputs.folder
    });

    if (env) {
        debug &&
            context.debug(
                `Environment provided - selecting ${context.debug.hl(env)} Pulumi stack.`
            );

        let stackExists = true;
        try {
            const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
            const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

            await pulumi.run({
                command: ["stack", "select", env],
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER
                },
                execa: {
                    env: {
                        PULUMI_CONFIG_PASSPHRASE
                    }
                }
            });
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(
                `Project application ${red(folder)} (${red(env)} environment) does not exist.`
            );
        }
    }

    if (debug) {
        const pulumiCommand = `${context.debug.hl("pulumi " + command.join(" "))}`;
        debug &&
            context.debug(
                `Running the following command in ${context.debug.hl(
                    folder
                )} folder: ${pulumiCommand}`
            );
    }

    return pulumi.run({
        command,
        execa: {
            stdio: "inherit",
            env: {
                WEBINY_ENV: env,
                WEBINY_PROJECT_NAME: context.project.name
            }
        }
    });
};
