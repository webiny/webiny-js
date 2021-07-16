import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies, { EsDomain } from "./policies";

interface HeadlessCMSParams {
    env: Record<string, any>;
    primaryDynamodbTable: aws.dynamodb.Table;
    elasticsearchDynamodbTable: aws.dynamodb.Table;
    elasticsearchDomain: EsDomain;
}

class HeadlessCMS {
    functions: {
        graphql: aws.lambda.Function;
    };
    role: aws.iam.Role;

    constructor({
        env,
        primaryDynamodbTable,
        elasticsearchDynamodbTable,
        elasticsearchDomain
    }: HeadlessCMSParams) {
        const roleName = "headless-cms-lambda-role";
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

        const policy = policies.getHeadlessCmsLambdaPolicy({
            primaryDynamodbTable,
            elasticsearchDomain,
            elasticsearchDynamodbTable
        });

        new aws.iam.RolePolicyAttachment(`${roleName}-HeadlessCmsLambdaPolicy`, {
            role: this.role,
            policyArn: policy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`${roleName}-AWSLambdaBasicExecutionRole`, {
            role: this.role,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        this.functions = {
            graphql: new aws.lambda.Function("headless-cms", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("../code/headlessCMS/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                }
            })
        };
    }
}

export default HeadlessCMS;
