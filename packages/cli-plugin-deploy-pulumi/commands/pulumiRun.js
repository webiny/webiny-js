const { green, red } = require("chalk");
const { login, getPulumi, loadEnvVariables } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");
const path = require("path");

module.exports = async (inputs, context) => {
    const [, ...command] = inputs._;
    const { env, folder } = inputs;

    await loadEnvVariables(inputs, context);

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(process.cwd(), inputs.folder)
    });

    await login(projectApplication);

    const pulumi = await getPulumi({
        execa: {
            cwd: projectApplication.root
        }
    });

    if (env) {
        context.info(`Environment provided - selecting ${green(env)} Pulumi stack.`);

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

    context.info(`Running the following command in ${green(folder)} folder:`);
    context.info(`${green("pulumi " + command.join(" "))}`);

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
