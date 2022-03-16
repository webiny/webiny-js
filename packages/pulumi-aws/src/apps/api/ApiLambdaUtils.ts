import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi-sdk";

import { Vpc } from "./ApiVpc";

interface LambdaRoleParams {
    name: string;
    policy: pulumi.Output<aws.iam.Policy>;
    vpc: Vpc | undefined;
}

export function createLambdaRole(app: PulumiApp, params: LambdaRoleParams) {
    const role = app.addResource(aws.iam.Role, {
        name: params.name,
        config: {
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        },
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${params.name}-policy`,
        config: {
            role: role.output,
            policyArn: params.policy.arn
        }
    });

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${params.name}-execution-role`,
        config: {
            role: role.output,
            policyArn: params.vpc
                ? aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
                : aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        }
    });

    return role;
}
