import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { ApiGraphql } from "~/apps";
import { getAwsAccountId, getAwsRegion } from "~/apps/awsUtils.js";
import kebabCase from "lodash/kebabCase.js";

export type ApiScheduler = PulumiAppModule<typeof ApiScheduler>;

export const ApiSchedulerBaseName = "scheduler-resolver";

const createResourceName = (name: string): string => {
    return `${ApiSchedulerBaseName}-${kebabCase(name)}`;
};

export const ApiScheduler = createAppModule({
    name: "ApiScheduler",
    config(app: PulumiApp) {
        const awsRegion = getAwsRegion(app);
        const awsAccountId = getAwsAccountId(app);
        const graphql = app.getModule(ApiGraphql);
        // const baseConfig = graphql.functions.graphql.config.clone();
        /*
        const schedulerResolverLambda = app.addResource(aws.lambda.Function, {
            name: createResourceName("lambda"),
            config: {
                ...baseConfig,
                layers: graphql.functions.graphql.output.layers.apply(arns => {
                    return Array.from(new Set([...(arns || []), getLayerArn("sharp")]));
                }),
                description: "Performs scheduled operations on Headless CMS entries."
            }
        });
        */

        const schedulerResolverInvokeRole = app.addResource(aws.iam.Role, {
            name: createResourceName("invokeRole"),
            config: {
                assumeRolePolicy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: {
                                Service: "scheduler.amazonaws.com"
                            },
                            Action: "sts:AssumeRole"
                        }
                    ]
                })
            }
        });

        const schedulerResolverInvokeLambdaPolicy = app.addResource(aws.iam.RolePolicy, {
            name: createResourceName("invokeLambdaPolicy"),
            config: {
                role: schedulerResolverInvokeRole.output.id,
                policy: graphql.functions.graphql.output.arn.apply(resolverArn => {
                    return JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Effect: "Allow",
                                Action: ["lambda:InvokeFunction"],
                                Resource: resolverArn
                            }
                        ]
                    });
                })
            }
        });

        const schedulerControlPolicy = app.addResource(aws.iam.Policy, {
            name: createResourceName("controlPolicy"),
            config: {
                description: "Allow GraphQL Lambda to manage EventBridge Scheduler",
                policy: pulumi
                    .all([schedulerResolverInvokeRole.output.arn, awsRegion, awsAccountId])
                    .apply(([invokeRoleArn, region, accountId]) => {
                        return JSON.stringify({
                            Version: "2012-10-17",
                            Statement: [
                                {
                                    Effect: "Allow",
                                    Action: [
                                        "scheduler:CreateSchedule",
                                        "scheduler:UpdateSchedule",
                                        "scheduler:DeleteSchedule",
                                        "scheduler:GetSchedule",
                                        "scheduler:ListSchedules"
                                    ],
                                    Resource: [
                                        `arn:aws:scheduler:${region}:${accountId}:schedule/default/*`
                                    ]
                                },
                                {
                                    Effect: "Allow",
                                    Action: "iam:PassRole",
                                    Resource: [invokeRoleArn, `${invokeRoleArn}/*`]
                                }
                            ]
                        });
                    })
            }
        });

        const schedulerResolverPolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
            name: createResourceName("graphqlSchedulerPolicyAttachment"),
            config: {
                role: graphql.role.output.name,
                policyArn: schedulerControlPolicy.output.arn
            }
        });

        return {
            invokeRole: schedulerResolverInvokeRole,
            invokePolicy: schedulerResolverInvokeLambdaPolicy,
            policyAttachment: schedulerResolverPolicyAttachment
        };
    }
});
