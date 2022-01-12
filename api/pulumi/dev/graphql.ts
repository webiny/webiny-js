import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies from "./policies";

interface GraphqlParams {
    env: Record<string, any>;
    primaryDynamodbTableArn: string;
    fileManagerBucketId: string;
    cognitoUserPoolArn: string;
}

class Graphql {
    functions: {
        api: aws.lambda.Function;
    };
    role: aws.iam.Role;

    constructor(params: GraphqlParams) {
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
            bucketId: params.fileManagerBucketId,
            cognitoUserPoolArn: params.cognitoUserPoolArn,
            primaryDynamodbTableArn: params.primaryDynamodbTableArn
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
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("../code/graphql/build")
                }),
                environment: {
                    variables: {
                        ...params.env,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                }
            })
        };
    }
}

export default Graphql;
