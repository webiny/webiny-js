import { readFileSync } from "fs";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

interface Config {
    apiFolder?: string;
    apiEnv?: string;
}

interface Params {
    region: string;
    dynamoDbTable: string;
}

function createFunctionArchive({ dynamoDbTable, region }: Params) {
    const handler = readFileSync(__dirname + "/functions/origin/request.js", "utf-8");

    const source = handler
        .replace("{DB_TABLE_NAME}", dynamoDbTable)
        .replace("{DB_TABLE_REGION}", region);

    return new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(source)
    });
}

export class WebsiteTenantRouter extends pulumi.ComponentResource {
    public readonly originRequest: aws.lambda.Function;

    constructor(name: string, config: Config = {}, opts = {}) {
        super("webiny:aws:WebsiteTenantRouter", name, {}, opts);

        const { region, dynamoDbTable } = getStackOutput<{ region: string; dynamoDbTable: string }>(
            {
                folder: config.apiFolder || "api",
                env: config.apiEnv || String(process.env.WEBINY_ENV)
            }
        );

        const inlinePolicies = Promise.all([aws.getCallerIdentity({})]).then(([callerIdentity]) => [
            {
                name: "dynamodb-policy",
                policy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Sid: "PermissionForDynamodb",
                            Effect: "Allow",
                            Action: ["dynamodb:GetItem"],
                            Resource: [
                                `arn:aws:dynamodb:${region}:${callerIdentity.accountId}:table/${dynamoDbTable}`,
                                `arn:aws:dynamodb:${region}:${callerIdentity.accountId}:table/${dynamoDbTable}/*`
                            ]
                        }
                    ]
                })
            }
        ]);

        const role = new aws.iam.Role(
            `${name}-role`,
            {
                inlinePolicies,
                managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
                assumeRolePolicy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: "sts:AssumeRole",
                            Principal: aws.iam.Principals.LambdaPrincipal,
                            Effect: "Allow"
                        },
                        {
                            Action: "sts:AssumeRole",
                            Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                            Effect: "Allow"
                        }
                    ]
                }
            },
            { parent: this }
        );

        // Some resources _must_ be put in us-east-1, such as Lambda at Edge.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        this.originRequest = new aws.lambda.Function(
            `${name}-origin-request`,
            {
                publish: true,
                runtime: "nodejs14.x",
                handler: "index.handler",
                role: role.arn,
                timeout: 5,
                memorySize: 128,
                code: createFunctionArchive({ region, dynamoDbTable })
            },
            { provider: awsUsEast1, parent: this }
        );

        this.registerOutputs();
    }
}
