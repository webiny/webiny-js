import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { CoreVpc } from "./CoreVpc.js";

export interface CoreVpcEndpointsParams {
    vpc: Pick<CoreVpc, "vpc" | "subnets" | "routeTables">;
    region: pulumi.Input<string>;
    /* The project has `<Infra.AuroraPostgres />`. */
    usesPostgres: boolean;
}

/**
 * The VPC endpoints of `<Infra.Vpc useVpcEndpoints />`: gateways for S3 and DynamoDB, interfaces for
 * SQS and EventBridge. With `<Infra.AuroraPostgres />` there's no DynamoDB endpoint: nothing in the
 * VPC talks to DynamoDB.
 */
export const addCoreVpcEndpoints = (app: PulumiApp, params: CoreVpcEndpointsParams) => {
    const { vpc, subnets, routeTables } = params.vpc;
    const { region } = params;

    app.addResource(aws.ec2.VpcEndpoint, {
        name: "vpc-s3-vpc-endpoint",
        config: {
            vpcId: vpc.output.id,
            serviceName: pulumi.interpolate`com.amazonaws.${region}.s3`,
            routeTableIds: [routeTables.privateSubnets.output.id]
        }
    });

    if (!params.usesPostgres) {
        app.addResource(aws.ec2.VpcEndpoint, {
            name: "vpc-dynamodb-vpc-endpoint",
            config: {
                vpcId: vpc.output.id,
                serviceName: pulumi.interpolate`com.amazonaws.${region}.dynamodb`,
                routeTableIds: [routeTables.privateSubnets.output.id]
            }
        });
    }

    app.addResource(aws.ec2.VpcEndpoint, {
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

    app.addResource(aws.ec2.VpcEndpoint, {
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
};
