import * as aws from "@pulumi/aws";
import {
    createCorePulumiApp as baseCreateCorePulumiApp,
    CreateCorePulumiAppParams as BaseCreateCorePulumiAppParams
} from "~/apps/core/createCorePulumiApp";
import { isResourceOfType } from "@webiny/pulumi";

export type CorePulumiApp = ReturnType<typeof createCorePulumiApp>;

export type CorePulumiAppAdvancedVpcParams = Partial<{
    useVpcEndpoints: boolean;
    useExistingVpc: {
        elasticSearchDomainVpcConfig: aws.types.input.elasticsearch.DomainVpcOptions;
    };
}>;

export interface CreateCorePulumiAppParams extends Omit<BaseCreateCorePulumiAppParams, "vpc"> {
    vpc?: boolean | CorePulumiAppAdvancedVpcParams;
}

export function createCorePulumiApp(projectAppParams: CreateCorePulumiAppParams = {}) {
    const { vpc, elasticSearch, pulumi } = projectAppParams;
    const usingAdvancedVpcParams = vpc && typeof vpc !== "boolean";

    return baseCreateCorePulumiApp({
        ...projectAppParams,
        vpc: usingAdvancedVpcParams && vpc.useExistingVpc ? false : Boolean(vpc),
        pulumi(...args) {
            // Not using advanced VPC params? Then immediately exit.
            if (!usingAdvancedVpcParams) {
                return pulumi?.(...args);
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

                if (!useExistingVpc.elasticSearchDomainVpcConfig) {
                    throw new Error(
                        "Cannot specify `useExistingVpc` parameter because the `elasticSearchDomainVpcConfig` parameter wasn't provided."
                    );
                }

                if (elasticSearch) {
                    onResource(resource => {
                        if (isResourceOfType(resource, aws.elasticsearch.Domain)) {
                            resource.config.vpcOptions(
                                useExistingVpc!.elasticSearchDomainVpcConfig
                            );
                        }
                    });
                }
            } else if (useVpcEndpoints) {
                // 2. Now we deal with "non-existing VPC" setup.
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
                        serviceName: "com.amazonaws.eu-central-1.s3",
                        routeTableIds: [routeTables.privateSubnets.output.id]
                    }
                });

                addResource(aws.ec2.VpcEndpoint, {
                    name: "vpc-dynamodb-vpc-endpoint",
                    config: {
                        vpcId: vpc.output.id,
                        serviceName: "com.amazonaws.eu-central-1.dynamodb",
                        routeTableIds: [routeTables.privateSubnets.output.id]
                    }
                });

                addResource(aws.ec2.VpcEndpoint, {
                    name: "vpc-sqs-vpc-endpoint",
                    config: {
                        vpcId: vpc.output.id,
                        serviceName: "com.amazonaws.eu-central-1.sqs",
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
                        serviceName: "com.amazonaws.eu-central-1.events",
                        vpcEndpointType: "Interface",
                        privateDnsEnabled: true,
                        securityGroupIds: [vpc.output.defaultSecurityGroupId],
                        subnetIds: subnets.private.map(subNet => subNet.output.id)
                    }
                });
            }

            return pulumi?.(...args);
        }
    });
}
