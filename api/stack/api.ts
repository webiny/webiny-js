import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class Api {
    dynamoDbTables: Record<string, aws.dynamodb.Table>;
    functions: Record<string, aws.lambda.Function>;
    constructor({ env }: { env: Record<string, any> }) {
        this.dynamoDbTables = {
            security: new aws.dynamodb.Table("SECURITY", {
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
            }),
            i18n: new aws.dynamodb.Table("I18N", {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" }
                ],
                billingMode: "PAY_PER_REQUEST",
                hashKey: "PK",
                rangeKey: "SK"
            }),
            pageBuilder: new aws.dynamodb.Table("PageBuilder", {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" }
                ],
                billingMode: "PAY_PER_REQUEST",
                hashKey: "PK",
                rangeKey: "SK"
            })
        };

        this.functions = {
            api: new aws.lambda.Function("api", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: defaultLambdaRole.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/api/build")
                }),
                environment: {
                    variables: {
                        ...env,
                        DB_TABLE_I18N: this.dynamoDbTables.i18n.name,
                        DB_TABLE_PAGE_BUILDER: this.dynamoDbTables.pageBuilder.name,
                        DB_TABLE_SECURITY: this.dynamoDbTables.security.name,
                        STORAGE_NAME: this.dynamoDbTables.security.name
                    }
                },
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            })
        };
    }
}

export default Api;
