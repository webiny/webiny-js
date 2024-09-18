import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { LAMBDA_RUNTIME } from "@webiny/pulumi-aws";

interface GraphqlParams {
    env: Record<string, any>;
    dbTable: aws.dynamodb.Table;
}

class Graphql {
    functions: {
        api: aws.lambda.Function;
    };

    constructor({ env, dbTable }: GraphqlParams) {
        const role = new aws.iam.Role("project-application-name", {
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

        const policy = new aws.iam.Policy("project-application-name", {
            description:
                "Project application name - enables the GraphQL API Lambda function to access AWS DynamoDB.",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${dbTable.arn}`,
                            pulumi.interpolate`${dbTable.arn}/*`
                        ]
                    }
                ]
            }
        });

        new aws.iam.RolePolicyAttachment(`project-application-name`, {
            role,
            policyArn: policy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`project-application-name-execution`, {
            role,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        this.functions = {
            api: new aws.lambda.Function("project-application-name", {
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                description: "Project application name - GraphQL API Lambda function.",
                role: role.arn,
                timeout: 30,
                memorySize: 1024,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("../code/graphql/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                }
            })
        };
    }
}

export default Graphql;
