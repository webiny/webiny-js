import { PulumiApp } from "@webiny/pulumi";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface Params {
    name: string;
    lambdaFunctionArn: pulumi.Input<string>;
}

export const createBackgroundTaskStepFunctionPolicy = (app: PulumiApp, params: Params) => {
    const { name, lambdaFunctionArn } = params;
    return app.addResource(aws.iam.Policy, {
        name,
        config: {
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: lambdaFunctionArn
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "logs:CreateLogDelivery",
                            "logs:CreateLogStream",
                            "logs:GetLogDelivery",
                            "logs:UpdateLogDelivery",
                            "logs:DeleteLogDelivery",
                            "logs:ListLogDeliveries",
                            "logs:PutLogEvents",
                            "logs:PutResourcePolicy",
                            "logs:DescribeResourcePolicies",
                            "logs:DescribeLogGroups"
                        ],
                        Resource: "*"
                    }
                ]
            }
        }
    });
};
