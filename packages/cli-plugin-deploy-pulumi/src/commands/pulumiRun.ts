import { createPulumiCommand, getStackName } from "~/utils";
import {
    createEnvConfiguration,
    withEnv,
    withEnvVariant,
    withProjectName,
    withPulumiConfigPassphrase,
    withRegion
} from "~/utils/env";

export const pulumiRunCommand = createPulumiCommand({
    name: "pulumi",
    createProjectApplicationWorkspace: false,
    command: async ({ inputs, context, pulumi }) => {
        const [, ...command] = inputs._;
        const { env, variant, folder, debug } = inputs;

        const stackName = getStackName({
            env,
            variant
        });

        if (env) {
            debug && context.debug(`Environment provided - selecting %s Pulumi stack.`, stackName);

            let stackExists = true;
            try {
                const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

                await pulumi.run({
                    command: ["stack", "select", stackName],
                    args: {
                        secretsProvider: PULUMI_SECRETS_PROVIDER
                    },
                    execa: {
                        env: createEnvConfiguration({
                            configurations: [withPulumiConfigPassphrase()]
                        })
                    }
                });
            } catch {
                stackExists = false;
            }

            if (!stackExists) {
                const variantNameMessage = variant ? `, ${context.error.hl(variant)} variant` : "";
                throw new Error(
                    `Project application ${context.error.hl(folder)} (${context.error.hl(
                        env
                    )} environment${variantNameMessage}) does not exist.`
                );
            }
        }

        if (debug) {
            debug &&
                context.debug(
                    `Running the following command in %s folder: %s`,
                    folder,
                    "pulumi " + command.join(" ")
                );
        }

        return pulumi.run({
            command: command as string[],
            execa: {
                stdio: "inherit",
                env: createEnvConfiguration({
                    configurations: [
                        withRegion(inputs),
                        withEnv(inputs),
                        withEnvVariant(inputs),
                        withProjectName(context)
                    ]
                })
            }
        });
    }
});
