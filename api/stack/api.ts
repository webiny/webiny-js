import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
// import vpc from "./vpc";

class Api {
    dynamoDbTable: aws.dynamodb.Table;
    functions: {
        api: aws.lambda.Function;
        graphqlPlayground: aws.lambda.Function;
    };
    role: aws.iam.Role;
    policy: aws.iam.RolePolicyAttachment;
    constructor({ env }: { env: Record<string, any> }) {
        this.dynamoDbTable = new aws.dynamodb.Table("webiny", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" },
                { name: "GSI1_PK", type: "S" },
                { name: "GSI1_SK", type: "S" }
            ],
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK",
            globalSecondaryIndexes: [
                {
                    name: "GSI1",
                    hashKey: "GSI1_PK",
                    rangeKey: "GSI1_SK",
                    projectionType: "ALL",
                    readCapacity: 1,
                    writeCapacity: 1
                }
            ]
        });

        this.role = new aws.iam.Role("default-lambda-role", {
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

        this.policy = new aws.iam.RolePolicyAttachment("default-lambda-role-policy", {
            role: this.role,
            policyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
        });

        this.functions = {
            api: new aws.lambda.Function("api", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/api/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        DB_TABLE: this.dynamoDbTable.name,
                        STORAGE_NAME: this.dynamoDbTable.name
                    }
                }
                // vpcConfig: {
                //     subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                //     securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                // }
            }),
            graphqlPlayground: new aws.lambda.Function("graphql-playground", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: this.role.arn,
                timeout: 30,
                memorySize: 128,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/graphqlPlayground/build")
                })
                /*vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }*/
            })
        };
    }
}

export default Api;
