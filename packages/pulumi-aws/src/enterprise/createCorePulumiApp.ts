import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {
    createCorePulumiApp as baseCreateCorePulumiApp,
    CreateCorePulumiAppParams as BaseCreateCorePulumiAppParams
} from "~/apps/core/createCorePulumiApp";
import { isResourceOfType, PulumiAppParam } from "@webiny/pulumi";
import { getAwsRegion } from "~/apps/awsUtils";

export type CorePulumiApp = ReturnType<typeof createCorePulumiApp>;

export type CorePulumiAppAdvancedVpcParams = Partial<{
    useVpcEndpoints: boolean;
    useExistingVpc: {
        elasticSearchDomainVpcConfig?: aws.types.input.elasticsearch.DomainVpcOptions;
        lambdaFunctionsVpcConfig: aws.types.input.lambda.FunctionVpcConfig;
    };
}>;

export interface CreateCorePulumiAppParams extends Omit<BaseCreateCorePulumiAppParams, "vpc"> {
    vpc?: PulumiAppParam<boolean | CorePulumiAppAdvancedVpcParams>;
}

export function createCorePulumiApp(projectAppParams: CreateCorePulumiAppParams = {}) {
    return baseCreateCorePulumiApp({
        ...projectAppParams,
        // If using existing VPC, we ensure `vpc` param is set to `false`.
        vpc: ({ getParam }) => {
            const vpc = getParam(projectAppParams.vpc);
            const usingAdvancedVpcParams = vpc && typeof vpc !== "boolean";
            return usingAdvancedVpcParams && vpc.useExistingVpc ? false : Boolean(vpc);
        },
        pulumi(...args) {
            const [app] = args;
            const { getParam } = app;
            const vpc = getParam(projectAppParams.vpc);
            const usingAdvancedVpcParams = vpc && typeof vpc !== "boolean";

            // Not using advanced VPC params? Then immediately exit.
            if (!usingAdvancedVpcParams) {
                return projectAppParams.pulumi?.(...args);
            }

            const [{ resources, addResource, onResource }] = args;
            const { useExistingVpc, useVpcEndpoints } = vpc;

            // 1. We first deal with "existing VPC" setup.
            if (useExistingVpc) {
                if ("useVpcEndpoints" in vpc) {
                    throw new Error(
                        "Cannot specify `useVpcEndpoints` parameter when using an existing VPC. The VPC endpoints configurations should be already defined within the existing VPC."
                    );
                }

                if (projectAppParams.elasticSearch) {
                    if (!useExistingVpc.elasticSearchDomainVpcConfig) {
                        throw new Error(
                            "Cannot specify `useExistingVpc` parameter because the `elasticSearchDomainVpcConfig` parameter wasn't provided."
                        );
                    }

                    onResource(resource => {
                        if (isResourceOfType(resource, aws.elasticsearch.Domain)) {
                            resource.config.vpcOptions(
                                useExistingVpc!.elasticSearchDomainVpcConfig
                            );
                        }
                    });
                }

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

                return projectAppParams.pulumi?.(...args);
            }

            // 2. Now we deal with "non-existing VPC" setup.
            if (useVpcEndpoints) {
                const region = getAwsRegion(app);

                onResource(resource => {
                    if (isResourceOfType(resource, aws.ec2.Vpc)) {
                        resource.config.enableDnsSupport(true);
                        resource.config.enableDnsHostnames(true);
                    }
                });

                const { vpc, subnets, routeTables } = resources.vpc!;
                addResource(aws.ec2.VpcEndpoint, {
                    name: "vpc-s3-vpc-endpoint",
                    config: {
                        vpcId: vpc.output.id,
                        serviceName: pulumi.interpolate`com.amazonaws.${region}.s3`,
                        routeTableIds: [routeTables.privateSubnets.output.id]
                    }
                });

                addResource(aws.ec2.VpcEndpoint, {
                    name: "vpc-dynamodb-vpc-endpoint",
                    config: {
                        vpcId: vpc.output.id,
                        serviceName: pulumi.interpolate`com.amazonaws.${region}.dynamodb`,
                        routeTableIds: [routeTables.privateSubnets.output.id]
                    }
                });

                addResource(aws.ec2.VpcEndpoint, {
                    name: "vpc-sqs-vpc-endpoint",
                    config: {
                        vpcId: vpc.output.id,
                        serviceName: pulumi.interpolate`com.amazonaws.${region}.sqs`,
                        vpcEndpointType: "Interface",
                        privateDnsEnabled: true,
                        securityGroupIds: [vpc.output.defaultSecurityGroupId],
                        subnetIds: subnets.private.map(subNet => subNet.output.id)
                    }
                });

                addResource(aws.ec2.VpcEndpoint, {
                    name: "vpc-events-vpc-endpoint",
                    config: {
                        vpcId: vpc.output.id,
                        serviceName: pulumi.interpolate`com.amazonaws.${region}.events`,
                        vpcEndpointType: "Interface",
                        privateDnsEnabled: true,
                        securityGroupIds: [vpc.output.defaultSecurityGroupId],
                        subnetIds: subnets.private.map(subNet => subNet.output.id)
                    }
                });
            }

            return projectAppParams.pulumi?.(...args);
        }
    });
}
