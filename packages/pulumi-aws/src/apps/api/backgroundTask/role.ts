import { PulumiApp } from "@webiny/pulumi";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface Params {
    name: string;
    policy: pulumi.Output<aws.iam.Policy>;
}

export const createBackgroundTaskStepFunctionRole = (app: PulumiApp, params: Params) => {
    const { name, policy } = params;
    const role = app.addResource(aws.iam.Role, {
        name,
        config: {
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "states.amazonaws.com"
                        },
                        Effect: "Allow"
                    }
                ]
            }
        }
    });
    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${name}Policy`,
        config: {
            role: role.output,
            policyArn: policy.arn
        }
    });

    return role;
};
