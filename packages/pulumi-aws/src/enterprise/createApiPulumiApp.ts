import * as aws from "@pulumi/aws";
import {
    createApiPulumiApp as baseCreateApiPulumiApp,
    CreateApiPulumiAppParams as BaseCreateApiPulumiAppParams
} from "~/apps/api/createApiPulumiApp";
import { isResourceOfType, PulumiAppParam } from "@webiny/pulumi";

export type ApiPulumiApp = ReturnType<typeof createApiPulumiApp>;

export type ApiPulumiAppAdvancedVpcParams = Partial<{
    useExistingVpc: {
        lambdaFunctionsVpcConfig: aws.types.input.lambda.FunctionVpcConfig;
    };
}>;

export interface CreateApiPulumiAppParams extends Omit<BaseCreateApiPulumiAppParams, "vpc"> {
    vpc?: PulumiAppParam<boolean | ApiPulumiAppAdvancedVpcParams>;
}

export function createApiPulumiApp(projectAppParams: CreateApiPulumiAppParams = {}) {
    return baseCreateApiPulumiApp({
        ...projectAppParams,
        // If using existing VPC, we ensure `vpc` param is set to `false`.
        vpc: ({ getParam }) => {
            const vpc = getParam(projectAppParams.vpc);
            const usingAdvancedVpcParams = vpc && typeof vpc !== "boolean";
            return usingAdvancedVpcParams && vpc.useExistingVpc ? false : Boolean(vpc);
        },
        pulumi(...args) {
            const [{ getParam }] = args;
            const vpc = getParam(projectAppParams.vpc);
            const usingAdvancedVpcParams = vpc && typeof vpc !== "boolean";

            // Not using advanced VPC params? Then immediately exit.
            if (!usingAdvancedVpcParams) {
                return projectAppParams.pulumi?.(...args);
            }

            const [{ onResource, addResource }] = args;
            const { useExistingVpc } = vpc;

            // 1. We first deal with "existing VPC" setup.
            if (useExistingVpc) {
                if (!useExistingVpc.lambdaFunctionsVpcConfig) {
                    throw new Error(
                        "Cannot specify `useExistingVpc` parameter because the `lambdaFunctionsVpcConfig` parameter wasn't provided."
                    );
                }

                onResource(resource => {
                    if (isResourceOfType(resource, aws.lambda.Function)) {
                        const canUseVpc = resource.meta.canUseVpc !== false;
                        if (canUseVpc) {
                            resource.config.vpcConfig(useExistingVpc!.lambdaFunctionsVpcConfig);
                        }
                    }

                    if (isResourceOfType(resource, aws.iam.Role)) {
                        if (resource.meta.isLambdaFunctionRole) {
                            addResource(aws.iam.RolePolicyAttachment, {
                                name: `${resource.name}-vpc-access-execution-role`,
                                config: {
                                    role: resource.output.name,
                                    policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
                                }
                            });
                        }
                    }
                });
            }

            return projectAppParams.pulumi?.(...args);
        }
    });
}
