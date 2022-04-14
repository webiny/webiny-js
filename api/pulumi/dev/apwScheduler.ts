import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies from "./policies";

interface ScheduleActionParams {
    env: Record<string, any>;
    primaryDynamodbTable: aws.dynamodb.Table;
}

const LAMBDA_NAME_PREFIX = "apw-scheduler";
const CREATE_RULE_LAMBDA = `${LAMBDA_NAME_PREFIX}-schedule-action-lambda`;
const EXECUTE_ACTION_LAMBDA = `${LAMBDA_NAME_PREFIX}-execute-action-lambda`;
const EVENT_RULE_NAME = `${LAMBDA_NAME_PREFIX}-event-rule`;
const EVENT_RULE_TARGET = `${LAMBDA_NAME_PREFIX}-event-rule-target`;

class ApwScheduler {
    scheduleActionLambdaRole: aws.iam.Role;
    executeActionLambdaRole: aws.iam.Role;
    functions: {
        scheduleAction: aws.lambda.Function;
        executeAction: aws.lambda.Function;
    };
    eventRule: aws.cloudwatch.EventRule;
    eventTarget: aws.cloudwatch.EventTarget;

    constructor({ env, primaryDynamodbTable }: ScheduleActionParams) {
        /**
         * Execute Action Lambda.
         */
        this.executeActionLambdaRole = new aws.iam.Role(`${EXECUTE_ACTION_LAMBDA}-role`, {
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
        });

        const policy = policies.getApwSchedulerExecuteActionLambdaPolicy({
            primaryDynamodbTable
        });

        new aws.iam.RolePolicyAttachment(`${EXECUTE_ACTION_LAMBDA}-role-policy-attachment`, {
            role: this.executeActionLambdaRole,
            policyArn: policy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`${EXECUTE_ACTION_LAMBDA}-AWSLambdaBasicExecutionRole`, {
            role: this.executeActionLambdaRole,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const apwScheduleActionExecuteActionLambda = new aws.lambda.Function(
            EXECUTE_ACTION_LAMBDA,
            {
                role: this.executeActionLambdaRole.arn,
                runtime: "nodejs14.x",
                handler: "handler.handler",
                timeout: 60,
                memorySize: 128,
                description: "Handle execute action workflow in apw scheduler",
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("../code/apw/executeAction/build")
                }),
                environment: {
                    variables: {
                        ...env
                    }
                }
            }
        );

        /**
         * Schedule Action Lambda.
         */
        this.scheduleActionLambdaRole = new aws.iam.Role(`${CREATE_RULE_LAMBDA}-role`, {
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
        });

        const createRuleLambdaPolicy = policies.getApwSchedulerScheduleActionLambdaPolicy({
            primaryDynamodbTable
        });

        new aws.iam.RolePolicyAttachment(`${CREATE_RULE_LAMBDA}-role-policy-attachment`, {
            role: this.scheduleActionLambdaRole,
            policyArn: createRuleLambdaPolicy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`${CREATE_RULE_LAMBDA}-AWSLambdaBasicExecutionRole`, {
            role: this.scheduleActionLambdaRole,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const apwScheduleActionCreateRuleLambda = new aws.lambda.Function(CREATE_RULE_LAMBDA, {
            role: this.scheduleActionLambdaRole.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle schedule action workflow in apw scheduler",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/apw/scheduleAction/build")
            }),
            environment: {
                variables: {
                    ...env,
                    APW_SCHEDULER_EXECUTE_ACTION_HANDLER: apwScheduleActionExecuteActionLambda.arn
                    // RULE_NAME: this.eventRule.name.apply(name => name),
                    // RULE_TARGET_ID: this.eventTarget.targetId.apply(id => id)
                }
            }
        });

        this.functions = {
            scheduleAction: apwScheduleActionCreateRuleLambda,
            executeAction: apwScheduleActionExecuteActionLambda
        };

        /**
         * Create event rule.
         */
        this.eventRule = new aws.cloudwatch.EventRule(EVENT_RULE_NAME, {
            description: `Enable us to schedule an action in publishing workflow at a particular datetime`,
            scheduleExpression: "cron(* * * * ? 2000)",
            isEnabled: true
        });

        /**
         * Add required permission to the target lambda.
         */
        new aws.lambda.Permission("eventTargetPermission", {
            action: "lambda:InvokeFunction",
            function: this.functions.scheduleAction.arn,
            principal: "events.amazonaws.com",
            statementId: "allow-rule-invoke-" + EVENT_RULE_NAME
        });

        /**
         *  Add lambda as target to the event rule.
         */
        this.eventTarget = new aws.cloudwatch.EventTarget(EVENT_RULE_TARGET, {
            rule: this.eventRule.name,
            arn: this.functions.scheduleAction.arn
        });
    }
}

export default ApwScheduler;
