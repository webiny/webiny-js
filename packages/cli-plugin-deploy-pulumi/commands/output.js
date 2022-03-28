const path = require("path");
const { red } = require("chalk");
const { login, getPulumi, loadEnvVariables } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");

module.exports = async (inputs, context) => {
    const { env, folder, json, variant } = inputs;
    await loadEnvVariables(inputs, context);

    const cwd = process.cwd();

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(cwd, inputs.folder)
    });

    // Will also install Pulumi, if not already installed.
    await login(projectApplication);

    const pulumi = await getPulumi({
        folder: inputs.folder
    });

    const stackName = variant ? `${env}.${variant}` : env;

    let stackExists = true;
    try {
        const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
        const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

        await pulumi.run({
            command: ["stack", "select", stackName],
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

    context.error(
        `Project application ${red(folder)} (${red(stackName)} environment) does not exist.`
    );
};
