import { createPulumiCommand, getStackName, processHooks } from "~/utils";
import {
    createEnvConfiguration,
    withEnv,
    withEnvVariant,
    withProjectName,
    withPulumiConfigPassphrase,
    withRegion
} from "~/utils/env";

export const destroyCommand = createPulumiCommand({
    name: "destroy",
    // We want to create a workspace just because there are cases where the destroy command is called
    // without the deployment happening initially (e.g. CI/CD scaffold's `pullRequestClosed.yml` workflow).
    createProjectApplicationWorkspace: true,
    command: async ({ inputs, context, projectApplication, pulumi, getDuration }) => {
        const { env, variant, folder } = inputs;

        const stackName = getStackName({
            env,
            variant
        });

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
            const variantNameMessage = variant ? `, ${variant} variant` : "";
            context.error(
                `Project application %s (%s environment${variantNameMessage}) does not exist.`,
                folder,
                env
            );
            return;
        }

        const hooksParams = { context, env, variant, projectApplication };

        await processHooks("hook-before-destroy", hooksParams);

        await pulumi.run({
            command: "destroy",
            args: {
                debug: inputs.debug || false,
                yes: true
            },
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

        console.log();

        context.success(`Done! Destroy finished in %s.`, getDuration());

        await processHooks("hook-after-destroy", hooksParams);
    }
});
