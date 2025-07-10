import { IPulumi, IUserCommandInput, ProjectApplication } from "~/types";
import { getStackName, getStackOutput, login } from "~/utils";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env";

export interface IPulumiLoginSelectStackParams {
    inputs: Pick<IUserCommandInput, "env" | "variant" | "folder" | "region">;
    projectApplication: Pick<ProjectApplication, "id" | "paths" | "project">;
    pulumi: Pick<IPulumi, "run">;
}

export const pulumiLoginSelectStack = async ({
    inputs,
    projectApplication,
    pulumi
}: IPulumiLoginSelectStackParams) => {
    const { env, variant } = inputs;

    await login(projectApplication);

    const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

    const stackName = getStackName({
        env,
        variant
    });

    await pulumi.run({
        command: ["stack", "select", stackName],
        args: {
            create: true,
            secretsProvider: PULUMI_SECRETS_PROVIDER
        },
        execa: {
            env: createEnvConfiguration({
                configurations: [withPulumiConfigPassphrase()]
            })
        }
    });

    /**
     * A region from the input or process CANNOT be different to the region from the stack.
     * Also, if there is no stack, everything is ok.
     */
    const region = inputs.region || process.env.AWS_REGION;

    const skip = ["core", "blueGreen", "sync"].includes(projectApplication.id);

    if (!skip) {
        const coreStack = getStackOutput({
            ...inputs,
            folder: "apps/core"
        });
        if (coreStack.region && coreStack.region !== region) {
            throw new Error(
                `Core App Region mismatch. Input: "${inputs.region || "none"}", process: "${
                    process.env.AWS_REGION || "none"
                }". In Core stack: "${
                    coreStack.region
                }". This can happen if you try to deploy a stack to a region different to the Core application region.`
            );
        }
    }

    const targetStack = getStackOutput({
        ...inputs
    });

    if (!targetStack?.region || targetStack.region === region) {
        return;
    }
    throw new Error(
        `Region mismatch. Input: "${inputs.region || "none"}", process: "${
            process.env.AWS_REGION || "none"
        }". In stack: "${
            targetStack.region
        }". This can happen if you try to deploy a stack to a region other than it was initially deployed.`
    );
};
