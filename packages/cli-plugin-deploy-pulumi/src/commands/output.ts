import { createPulumiCommand, getStackName } from "~/utils";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env";

export const outputCommand = createPulumiCommand({
    name: "output",
    createProjectApplicationWorkspace: false,
    command: async ({ inputs, context, pulumi }) => {
        const { env, variant, folder, json } = inputs;

        const stackName = getStackName({
            env,
            variant
        });

        let stackExists = true;
        try {
            const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

            await pulumi.run({
                command: ["stack", "select", `${stackName}`],
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

        if (stackExists) {
            return await pulumi.run({
                command: ["stack", "output"],
                args: {
                    json: !!json
                },
                execa: {
                    stdio: "inherit"
                }
            });
        }

        if (json) {
            return console.log(JSON.stringify(null));
        }

        const variantMessage = variant ? `, %s variant` : "";

        context.error(
            `Project application %s (%s environment${variantMessage}) does not exist.`,
            folder,
            env,
            variant
        );
    }
});
