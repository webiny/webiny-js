import { readFileSync } from "fs";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp, PulumiAppResource } from "@webiny/pulumi";
import { CoreOutput } from "./common";

interface Params {
    region: string;
    dynamoDbTable: string;
}

function createFunctionArchive({ dynamoDbTable, region }: Params) {
    const handler = readFileSync(
        __dirname + "/../components/tenantRouter/functions/origin/request.js",
        "utf-8"
    );

    const source = handler
        .replace("{DB_TABLE_NAME}", dynamoDbTable)
        .replace("{DB_TABLE_REGION}", region);

    return new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(source)
    });
}

const PREFIX = "website-router";

export function applyTenantRouter(
    app: PulumiApp,
    cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>
) {
    const region = String(process.env.AWS_REGION);

    // Register core output as a module available for all other modules
    const core = app.addModule(CoreOutput);

    // `primaryDynamodbTableName` is a string, hence the type cast here.
    const dynamoDbTable = core.primaryDynamodbTableName as unknown as string;

    const inlinePolicies = Promise.all([aws.getCallerIdentity({})]).then(([identity]) => [
        {
            name: "tenant-router-policy",
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
                        Effect: "Allow",
                        Action: ["dynamodb:GetItem"],
                        Resource: [
                            `arn:aws:dynamodb:${region}:${identity.accountId}:table/${dynamoDbTable}`,
                            `arn:aws:dynamodb:${region}:${identity.accountId}:table/${dynamoDbTable}/*`
                        ]
                    }
                ]
            })
        }
    ]);

    const role = app.addResource(aws.iam.Role, {
        name: `${PREFIX}-role`,
        config: {
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
        }
    });

    const originLambda = app.addHandler(() => {
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        return new aws.lambda.Function(
            `${PREFIX}-origin-request`,
            {
                publish: true,
                runtime: "nodejs14.x",
                handler: "index.handler",
                role: role.output.arn,
                timeout: 5,
                memorySize: 128,
                // TODO: @michal
                code: createFunctionArchive({
                    region,
                    dynamoDbTable
                })
            },
            {
                provider: awsUsEast1
            }
        );
    });

    cloudfront.config.defaultCacheBehavior(value => {
        const associations = value.lambdaFunctionAssociations || [];
        value.lambdaFunctionAssociations = [
            // @ts-ignore
            ...associations,
            {
                eventType: "origin-request",
                includeBody: false,
                // @ts-ignore
                // TODO: @michal - these Unwrapped types require `string` (lambdaArn)
                // but it should be `Input<string>` (check existing project)
                lambdaArn: originLambda.qualifiedArn
            }
        ];

        return value;
    });
}
