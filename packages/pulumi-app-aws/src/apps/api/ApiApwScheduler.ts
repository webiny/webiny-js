import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-app";
import { StorageOutput } from "../common";
import { getCommonLambdaEnvVariables } from "../lambdaUtils";

interface ScheduleActionParams {
    env: Record<string, any>;
}

const LAMBDA_NAME_PREFIX = "apw-scheduler";
const CREATE_RULE_LAMBDA = `${LAMBDA_NAME_PREFIX}-schedule-action-lambda`;
const EXECUTE_ACTION_LAMBDA = `${LAMBDA_NAME_PREFIX}-execute-action-lambda`;
const EVENT_RULE_NAME = `${LAMBDA_NAME_PREFIX}-event-rule`;
const EVENT_RULE_TARGET = `${LAMBDA_NAME_PREFIX}-event-rule-target`;

export type ApiApwScheduler = PulumiAppModule<typeof ApiApwScheduler>;

export const ApiApwScheduler = createAppModule({
    name: "ApiApwScheduler",
    config(app: PulumiApp, params: ScheduleActionParams) {
        const executeAction = createExecuteActionLambda(app, params);
        const scheduleAction = createScheduleActionLambda(app, executeAction.lambda.output, params);

        // Create event rule.
        const eventRule = app.addResource(aws.cloudwatch.EventRule, {
            name: EVENT_RULE_NAME,
            config: {
                description: `Enable us to schedule an action in publishing workflow at a particular datetime`,
                scheduleExpression: "cron(* * * * ? 2000)",
                isEnabled: true
            }
        });

        // Add required permission to the target lambda.
        app.addResource(aws.lambda.Permission, {
            name: "eventTargetPermission",
            config: {
                action: "lambda:InvokeFunction",
                function: scheduleAction.lambda.output.arn,
                principal: "events.amazonaws.com",
                statementId: "allow-rule-invoke-" + EVENT_RULE_NAME
            }
        });

        // Add lambda as target to the event rule.
        const eventTarget = app.addResource(aws.cloudwatch.EventTarget, {
            name: EVENT_RULE_TARGET,
            config: {
                rule: eventRule.output.name,
                arn: scheduleAction.lambda.output.arn
            }
        });

        return {
            executeAction,
            scheduleAction,
            eventRule,
            eventTarget
        };
    }
});

function createExecuteActionLambda(app: PulumiApp, params: ScheduleActionParams) {
    const role = app.addResource(aws.iam.Role, {
        name: `${EXECUTE_ACTION_LAMBDA}-role`,
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

    const policy = createExecuteActionLambdaPolicy(app);

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${EXECUTE_ACTION_LAMBDA}-role-policy-attachment`,
        config: {
            role: role.output,
            policyArn: policy.output.arn
        }
    });

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${EXECUTE_ACTION_LAMBDA}-AWSLambdaBasicExecutionRole`,
        config: {
            role: role.output,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        }
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: EXECUTE_ACTION_LAMBDA,
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle execute action workflow in apw scheduler",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.absolute, "code/apw/executeAction/build")
                )
            }),
            environment: {
                variables: {
                    ...getCommonLambdaEnvVariables(),
                    ...params.env
                }
            }
        }
    });

    return {
        role,
        policy,
        lambda
    };
}

function createExecuteActionLambdaPolicy(app: PulumiApp) {
    const storage = app.getModule(StorageOutput);

    return app.addResource(aws.iam.Policy, {
        name: "ApwSchedulerExecuteActionLambdaPolicy",
        config: {
            description: "This policy enables access to cloudwatch event and lambda invocation",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: ["*"]
                    },
                    {
                        Sid: "PermissionDynamoDB",
                        Effect: "Allow",
                        Action: ["dynamodb:Query", "dynamodb:GetItem", "dynamodb:DeleteItem"],
                        Resource: [
                            pulumi.interpolate`${storage.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${storage.primaryDynamodbTableArn}/*`
                        ]
                    }
                ]
            }
        }
    });
}

function createScheduleActionLambda(
    app: PulumiApp,
    executeLambda: pulumi.Output<aws.lambda.Function>,
    params: ScheduleActionParams
) {
    const role = app.addResource(aws.iam.Role, {
        name: `${CREATE_RULE_LAMBDA}-role`,
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

    const policy = createScheduleActionLambdaPolicy(app);

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${CREATE_RULE_LAMBDA}-role-policy-attachment`,
        config: {
            role: role.output,
            policyArn: policy.output.arn
        }
    });

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${CREATE_RULE_LAMBDA}-AWSLambdaBasicExecutionRole`,
        config: {
            role: role.output,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        }
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: CREATE_RULE_LAMBDA,
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle schedule action workflow in apw scheduler",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.absolute, "code/apw/scheduleAction/build")
                )
            }),
            environment: {
                variables: {
                    ...getCommonLambdaEnvVariables(),
                    ...params.env,
                    APW_SCHEDULER_EXECUTE_ACTION_HANDLER: executeLambda.arn
                    // RULE_NAME: this.eventRule.name.apply(name => name),
                    // RULE_TARGET_ID: this.eventTarget.targetId.apply(id => id)
                }
            }
        }
    });

    return {
        role,
        policy,
        lambda
    };
}

function createScheduleActionLambdaPolicy(app: PulumiApp) {
    const storage = app.getModule(StorageOutput);

    return app.addResource(aws.iam.Policy, {
        name: "ApwSchedulerScheduleActionLambdaPolicy",
        config: {
            description: "This policy enables access to cloudwatch event and lambda invocation",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: ["*"]
                    },
                    {
                        Sid: "PermissionDynamoDB",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${storage.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${storage.primaryDynamodbTableArn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionEvents",
                        Effect: "Allow",
                        Action: [
                            "events:DeleteRule",
                            "events:PutTargets",
                            "events:PutRule",
                            "events:ListRules",
                            "events:RemoveTargets",
                            "events:ListTargetsByRule"
                        ],
                        Resource: ["*"]
                    }
                ]
            }
        }
    });
}
