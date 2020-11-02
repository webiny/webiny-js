import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class Security {
    functions: {
        graphql: aws.lambda.Function;
        validateAccessToken: aws.lambda.Function;
        permissionsManager: aws.lambda.Function;
    };
    dynamoDbTable: aws.dynamodb.Table;
    constructor({ dbProxy, env }: { dbProxy: aws.lambda.Function; env: { [key: string]: any } }) {
        this.dynamoDbTable = new aws.dynamodb.Table("Security", {
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

        const permissionsManager = new aws.lambda.Function("security-permissions-manager", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/security/permissionsManager/build")
            }),
            environment: {
                variables: {
                    DB_TABLE: this.dynamoDbTable.name,
                    DB_PROXY_FUNCTION: dbProxy.arn,
                    DEBUG: String(process.env.DEBUG)
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        const validateAccessToken = new aws.lambda.Function("security-validate-access-token", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/security/validateAccessToken/build")
            }),
            environment: {
                variables: {
                    DB_TABLE: this.dynamoDbTable.name,
                    DB_PROXY_FUNCTION: dbProxy.arn,
                    PERMISSIONS_MANAGER_FUNCTION: permissionsManager.arn,
                    DEBUG: String(process.env.DEBUG)
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        const graphql = new aws.lambda.Function("security-graphql", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/security/graphql/build")
            }),
            environment: {
                variables: {
                    ...env,
                    VALIDATE_ACCESS_TOKEN_FUNCTION: validateAccessToken.arn,
                    PERMISSIONS_MANAGER_FUNCTION: permissionsManager.arn,
                    DB_TABLE: this.dynamoDbTable.name
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        this.functions = {
            validateAccessToken,
            graphql,
            permissionsManager
        };
    }
}

export default Security;
