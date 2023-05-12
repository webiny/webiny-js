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

    // Get Core app output
    const core = app.getModule(CoreOutput);

    // `primaryDynamodbTableName` is a string, hence the type cast here.
    const dynamoDbTable = core.primaryDynamodbTableName;

    // Because of JSON.stringify, we need to resolve promises upfront.
    const inlinePolicies = pulumi
        .all([aws.getCallerIdentity({}), dynamoDbTable])
        .apply(([identity, dynamoDbTable]) => [
            {
                name: "tenant-router-policy",
                policy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Sid: "PermissionForDynamodb",
                            Effect: "Allow",
                            Action: ["dynamodb:GetItem", "dynamodb:Query"],
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

    const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

    const originLambda = app.addResource(aws.lambda.Function, {
        name: `${PREFIX}-origin-request`,
        config: {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.handler",
            role: role.output.arn,
            timeout: 5,
            memorySize: 128,
            code: dynamoDbTable.apply(dynamoDbTable => {
                return createFunctionArchive({
                    region,
                    dynamoDbTable
                });
            })
        },
        opts: { provider: awsUsEast1 }
    });

    cloudfront.config.defaultCacheBehavior(value => {
        return {
            ...value,
            // We need to forward the `Host` header so the Lambda@Edge knows what custom domain was requested.
            forwardedValues: {
                ...value.forwardedValues,
                queryString: value.forwardedValues?.queryString || false,
                cookies: value.forwardedValues?.cookies || { forward: "none" },
                headers: [...(value.forwardedValues?.headers || []), "Host"]
            },
            lambdaFunctionAssociations: [
                ...(value.lambdaFunctionAssociations || []),
                {
                    eventType: "origin-request",
                    includeBody: false,
                    lambdaArn: originLambda.output.qualifiedArn
                }
            ]
        };
    });
}
