import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi";
import { VpcConfig } from "./common";

export * from "../utils/lambdaEnvVariables";

interface LambdaRoleParams {
    name: string;
    policy?: pulumi.Output<aws.iam.Policy>;
    executionRole?: pulumi.Input<string>;
}

const createLambdaRoleWithoutExecution = (app: PulumiApp, params: LambdaRoleParams) => {
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
        },
        meta: { isLambdaFunctionRole: true }
    });

    if (params.policy) {
        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${params.name}-policy`,
            config: {
                role: role.output,
                policyArn: params.policy.arn
            }
        });
    }

    if (params.executionRole) {
        // If execution role is set, use it.
        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${params.name}-execution-role`,
            config: {
                role: role.output,
                policyArn: params.executionRole
            }
        });
    }
    return role;
};

export function createLambdaRole(app: PulumiApp, params: LambdaRoleParams) {
    const role = createLambdaRoleWithoutExecution(app, params);

    // Add default execution role.
    const vpc = app.getModule(VpcConfig);

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${params.name}-default-execution-role`,
        config: {
            role: role.output,
            policyArn: vpc.enabled.apply(enabled =>
                enabled
                    ? aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
                    : aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
            )
        }
    });

    return role;
}

export const createLambdaRoleWithoutVpc = (app: PulumiApp, params: LambdaRoleParams) => {
    const role = createLambdaRoleWithoutExecution(app, params);

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${params.name}-default-execution-role`,
        config: {
            role: role.output,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        }
    });

    return role;
};
