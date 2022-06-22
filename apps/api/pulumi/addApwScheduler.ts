import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { CoreOutput } from "@webiny/pulumi-aws";
import { ApiGraphql, ApiApwScheduler } from "@webiny/pulumi-aws";
import { PulumiApp } from "@webiny/pulumi";

export const addApwScheduler = (app: PulumiApp) => {
    const core = app.getModule(CoreOutput);

    const apwScheduler = app.addModule(ApiApwScheduler, {
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
            DB_TABLE: core.primaryDynamodbTableName,
            S3_BUCKET: core.fileManagerBucketId,
            WEBINY_LOGS_FORWARD_URL: String(process.env.WEBINY_LOGS_FORWARD_URL)
        }
    });

    const graphql = app.getModule(ApiGraphql);

    /**
     * Store meta information like "mainGraphqlFunctionArn" in APW settings at deploy time.
     *
     * Note: We can't pass "mainGraphqlFunctionArn" as env variable due to circular dependency between
     * "graphql" lambda and "api-apw-scheduler-execute-action" lambda.
     */
    app.addResource(aws.dynamodb.TableItem, {
        name: "apwSettings",
        config: {
            tableName: core.primaryDynamodbTableName,
            hashKey: core.primaryDynamodbTableHashKey,
            rangeKey: pulumi.output(core.primaryDynamodbTableRangeKey).apply(key => key || "SK"),
            item: pulumi.interpolate`{
              "PK": {"S": "APW#SETTINGS"},
              "SK": {"S": "${app.params.run.variant || "default"}"},
              "mainGraphqlFunctionArn": {"S": "${graphql.functions.graphql.output.arn}"},
              "eventRuleName": {"S": "${apwScheduler.eventRule.output.name}"},
              "eventTargetId": {"S": "${apwScheduler.eventTarget.output.targetId}"}
            }`
        }
    });

    app.addOutputs({
        apwSchedulerScheduleAction: apwScheduler.scheduleAction.lambda.output.arn,
        apwSchedulerExecuteAction: apwScheduler.executeAction.lambda.output.arn,
        apwSchedulerEventRule: apwScheduler.eventRule.output.name,
        apwSchedulerEventTargetId: apwScheduler.eventTarget.output.targetId
    });
};
