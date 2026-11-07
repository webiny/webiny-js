import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { getCommonLambdaEnvVariables } from "../lambdaUtils.js";
import { ApiGraphql } from "./ApiGraphql.js";

interface GraphqlWebParams {
    env: Record<string, any>;
}

export type ApiGraphqlWeb = PulumiAppModule<typeof ApiGraphqlWeb>;

/**
 * Serves the API's HTTP routes from a Lambda web function. Enabled with `<Infra.Api.WebFunction />`.
 *
 * A web function runs `build-web/index.mjs` as a plain Node HTTP server. It only serves HTTP, so the
 * `graphql` Lambda stays: background tasks, EventBridge rules, EventBridge Scheduler and the WebSocket
 * API still invoke it. CloudFront reaches the endpoint through an OAC, and the resource policy that
 * lets it do so is created in ApiCloudfront, because it needs the distribution's ARN.
 */
export const ApiGraphqlWeb = createAppModule({
    name: "ApiGraphqlWeb",
    config(app: PulumiApp, params: GraphqlWebParams) {
        const graphql = app.getModule(ApiGraphql);

        // Lambda pins each revision to an S3 object version, so the bucket must be versioned. Never
        // add a lifecycle rule that expires old versions: a revision whose object version is gone
        // moves to Failed for good.
        const codeBucket = app.addResource(aws.s3.Bucket, {
            name: "graphql-web-code",
            config: {
                forceDestroy: true
            }
        });

        app.addResource(aws.s3.BucketPublicAccessBlock, {
            name: "graphql-web-code-private",
            config: {
                bucket: codeBucket.output.id,
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true
            }
        });

        const versioning = app.addResource(aws.s3.BucketVersioning, {
            name: "graphql-web-code-versioning",
            config: {
                bucket: codeBucket.output.id,
                versioningConfiguration: { status: "Enabled" }
            }
        });

        const bundle = app.addResource(aws.s3.BucketObjectv2, {
            name: "graphql-web-code-bundle",
            config: {
                bucket: codeBucket.output.id,
                key: "web.zip",
                source: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "graphql/build-web")
                    )
                })
            },
            opts: { dependsOn: [versioning.output] }
        });

        // Web functions need an explicit name. Deriving it from the `graphql` Lambda's generated name
        // keeps it unique per environment and carries the resource name prefix.
        const functionName = graphql.functions.graphql.output.name.apply(name => `${name}-web`);

        const logGroup = app.addResource(aws.cloudwatch.LogGroup, {
            name: "graphql-web-logs",
            config: {
                name: pulumi.interpolate`/aws/lambda/web/${functionName}`,
                retentionInDays: 30
            }
        });

        const fn = app.addResource(aws.lambdaweb.Function, {
            name: "graphql-web",
            config: {
                functionName
            }
        });

        // Lambda reads the code itself, and only for this function's revisions.
        const codeAccess = app.addResource(aws.s3.BucketPolicy, {
            name: "graphql-web-code-read",
            config: {
                bucket: codeBucket.output.id,
                policy: pulumi.jsonStringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: { Service: "lambda.amazonaws.com" },
                            Action: ["s3:GetObject", "s3:GetObjectVersion"],
                            Resource: pulumi.interpolate`${codeBucket.output.arn}/*`,
                            Condition: {
                                ArnLike: {
                                    "aws:SourceArn": pulumi.interpolate`${fn.output.arn}/revision/*`
                                }
                            }
                        }
                    ]
                })
            }
        });

        const revision = app.addResource(aws.lambdaweb.FunctionRevision, {
            name: "graphql-web-revision",
            config: {
                functionName: fn.output.functionName,
                buildConfig: {
                    runtimeConfig: { runtime: "nodejs24.x" },
                    codeConfig: {
                        s3Object: {
                            bucket: bundle.output.bucket,
                            key: bundle.output.key,
                            versionId: bundle.output.versionId
                        }
                    }
                },
                serviceConfig: {
                    // Same role and permissions as the `graphql` Lambda. It already trusts
                    // `lambda.amazonaws.com`.
                    executionRoleArn: graphql.role.output.arn,
                    timeoutSeconds: 60,
                    // Default is 64. One environment has a fixed 2 GB, and building the GraphQL schema
                    // is memory heavy, so start lower.
                    maxConcurrencyPerEnvironment: 16,
                    environmentVariables: getWebFunctionEnvVariables(params.env),
                    telemetryConfig: {
                        loggingConfig: { logGroup: logGroup.output.name }
                    }
                }
            },
            opts: { dependsOn: [logGroup.output, codeAccess.output] }
        });

        const endpoint = app.addResource(aws.lambdaweb.FunctionEndpoint, {
            name: "graphql-web-endpoint",
            config: {
                functionName: fn.output.functionName,
                endpointName: "main",
                endpointType: "HomeRegion",
                authType: "IamAuth",
                // Traffic moves only when Pulumi repoints `revisionWeights`, so the replaced revision
                // can be deleted right after.
                autoDeploymentMode: "Disabled",
                revisionWeights: [{ revisionId: revision.output.revisionId, weight: 100 }]
            }
        });

        return {
            fn,
            revision,
            endpoint,
            codeBucket,
            logGroup
        };
    }
});

/**
 * The web function rejects an environment variable with an empty value, so those are left out. The
 * `graphql` env carries several that are often unset (OpenSearch, Okta).
 */
function getWebFunctionEnvVariables(env: Record<string, any>) {
    return pulumi
        .all([getCommonLambdaEnvVariables(), pulumi.output(env)])
        .apply(([common, own]) => {
            const nodeOptions = [common.NODE_OPTIONS, "--max-old-space-size=1536"]
                .filter(Boolean)
                .join(" ");

            const variables: Record<string, unknown> = {
                ...common,
                ...own,
                AWS_LAMBDA_NODEJS_ENTRYPOINT: "index.mjs",
                NODE_OPTIONS: nodeOptions
            };

            const result: Record<string, string> = {};
            for (const [name, value] of Object.entries(variables)) {
                if (value === undefined || value === null || value === "") {
                    continue;
                }
                result[name] = String(value);
            }
            return result;
        });
}
