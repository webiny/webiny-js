import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies from "./policies";

interface GraphqlParams {
    env: Record<string, any>;
    primaryDynamodbTable: aws.dynamodb.Table;
    bucket: aws.s3.Bucket;
    cognitoUserPool: aws.cognito.UserPool;
    apwSchedulerEventRule: aws.cloudwatch.EventRule;
    apwSchedulerEventTarget: aws.cloudwatch.EventTarget;
}

class Graphql {
    functions: {
        api: aws.lambda.Function;
    };
    role: aws.iam.Role;

    constructor({
        env,
        primaryDynamodbTable,
        bucket,
        cognitoUserPool,
        apwSchedulerEventRule,
        apwSchedulerEventTarget
    }: GraphqlParams) {
        const roleName = "api-lambda-role";
        this.role = new aws.iam.Role(roleName, {
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

        const policy = policies.getApiGraphqlLambdaPolicy({
            primaryDynamodbTable,
            bucket,
            cognitoUserPool
        });

        new aws.iam.RolePolicyAttachment(`${roleName}-ApiGraphqlLambdaPolicy`, {
            role: this.role,
            policyArn: policy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`${roleName}-AWSLambdaBasicExecutionRole`, {
            role: this.role,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        this.functions = {
            api: new aws.lambda.Function("graphql", {
                runtime: "nodejs14.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("../code/graphql/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
                        WCP_ENVIRONMENT_API_KEY: String(process.env.WCP_ENVIRONMENT_API_KEY)
                    }
                }
            })
        };
        /**
         * Store meta information like "mainGraphqlFunctionArn" in APW settings at deploy time.
         *
         * Note: We can't pass "mainGraphqlFunctionArn" as env variable due to circular dependency between
         * "graphql" lambda and "api-apw-scheduler-execute-action" lambda.
         */
        new aws.dynamodb.TableItem("apwSettings", {
            tableName: primaryDynamodbTable.name,
            hashKey: primaryDynamodbTable.hashKey,
            rangeKey: primaryDynamodbTable.rangeKey.apply(key => key || "SK"),
            item: pulumi.interpolate`{
              "PK": {"S": "APW#SETTINGS"},
              "SK": {"S": "A"},
              "mainGraphqlFunctionArn": {"S": "${this.functions.api.arn}"},
              "eventRuleName": {"S": "${apwSchedulerEventRule.name}"},
              "eventTargetId": {"S": "${apwSchedulerEventTarget.targetId}"}
            }`
        });
    }
}

export default Graphql;
