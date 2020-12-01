import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";

class Graphql {
    functions: {
        api: aws.lambda.Function;
        graphqlPlayground: aws.lambda.Function;
    };
    role: aws.iam.Role;
    policy: aws.iam.RolePolicyAttachment;
    constructor({
        dynamoDbTable,
        env
    }: {
        dynamoDbTable: aws.dynamodb.Table;
        env: Record<string, any>;
    }) {
        this.role = new aws.iam.Role("api-lambda-role", {
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

        this.policy = new aws.iam.RolePolicyAttachment("api-lambda-role-policy", {
            role: this.role,
            policyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
        });

        this.functions = {
            api: new aws.lambda.Function("graphql", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/graphql/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        DB_TABLE: dynamoDbTable.name,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                },
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            }),
            graphqlPlayground: new aws.lambda.Function("graphql-playground", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 128,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/graphqlPlayground/build")
                }),
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            })
        };
    }
}

export default Graphql;
