import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";
import type { PulumiApp } from "@webiny/pulumi";
import type { PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { ApiGraphql } from "./ApiGraphql.js";

export interface GraphqlWebVpc {
    subnetIds: pulumi.Input<pulumi.Input<string>[]>;
    securityGroupIds: pulumi.Input<pulumi.Input<string>[]>;
}

interface GraphqlWebParams {
    /**
     * The project's Pulumi resource name prefix, so the function's name carries it like the other
     * resources' names do.
     */
    namePrefix: string;
    /**
     * The subnets and security groups the regular Lambdas use, when the project has a VPC. The web
     * function reaches them through an egress network connector.
     */
    vpc: GraphqlWebVpc | null;
}

export type ApiGraphqlWeb = PulumiAppModule<typeof ApiGraphqlWeb>;

/**
 * Serves the API's HTTP routes from a Lambda web function. On by default;
 * `<Infra.Api.WebFunction enabled={false} />` turns it off.
 *
 * A web function runs `build-web/index.mjs` as a plain Node HTTP server. It only serves HTTP, so the
 * `graphql` Lambda stays: background tasks, EventBridge rules, EventBridge Scheduler and the WebSocket
 * API still invoke it. CloudFront reaches the endpoint through an OAC, and the resource policy that
 * lets it do so is created in ApiCloudfront, because it needs the distribution's ARN. With a VPC, the
 * function's outbound traffic goes through an egress network connector into the same subnets the
 * regular Lambdas use.
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

        const buildWebFolder = path.join(app.paths.workspace, "graphql/build-web");
        const bundle = app.addResource(aws.s3.BucketObjectv2, {
            name: "graphql-web-code-bundle",
            config: {
                bucket: codeBucket.output.id,
                key: "web.zip",
                source: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(buildWebFolder)
                })
            },
            opts: { dependsOn: [versioning.output] }
        });

        // Web functions need an explicit name. The suffix is generated once per stack, so nothing
        // else renames the function. Deriving the name from the `graphql` Lambda's did: `webiny
        // watch` makes the next deploy replace that Lambda under a new name, which replaced the web
        // function and its endpoint domain too.
        const nameSuffix = app.addResource(random.RandomId, {
            name: "graphql-web-name-suffix",
            config: { byteLength: 4 }
        });
        const functionName = pulumi.interpolate`${params.namePrefix}graphql-web-${nameSuffix.output.hex}`;

        const fn = app.addResource(aws.lambdaweb.Function, {
            name: "graphql-web",
            config: {
                functionName
            },
            // Replacing a web function fails: Pulumi deletes the old revision while the old endpoint
            // still routes to it, which Lambda refuses. `functionName` is the only input that forces
            // a replacement, so once the function exists, a different name (a changed resource name
            // prefix, for example) is ignored rather than applied.
            opts: { ignoreChanges: ["functionName"] }
        });

        const logGroup = app.addResource(aws.cloudwatch.LogGroup, {
            name: "graphql-web-logs",
            config: {
                name: pulumi.interpolate`/aws/lambda/web/${fn.output.functionName}`,
                retentionInDays: 30
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

        let egressNetworkConnectorArn: pulumi.Output<string> | undefined;
        const revisionDependencies: pulumi.Input<pulumi.Resource>[] = [
            logGroup.output,
            codeAccess.output
        ];
        if (params.vpc) {
            const connector = createNetworkConnector(app, params.vpc);
            egressNetworkConnectorArn = connector.output.latestVersionArn;
            revisionDependencies.push(connector.output);
        }

        const graphqlEnvironment = graphql.functions.graphql.output.environment;
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
                    environmentVariables: getWebFunctionEnvVariables(graphqlEnvironment),
                    // Unset without a VPC: the function then reaches public endpoints directly.
                    egressNetworkConnectorArn,
                    telemetryConfig: {
                        loggingConfig: { logGroup: logGroup.output.name }
                    }
                }
            },
            opts: { dependsOn: revisionDependencies }
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

        // Paths of `<Api.Route>` routes. Whoever routes HTTP to the web function (ApiCloudfront)
        // listens with `onRoute`; routes added before it listens are replayed to it.
        const routePaths: string[] = [];
        const routeListeners: Array<(routePath: string) => void> = [];

        return {
            fn,
            revision,
            endpoint,
            codeBucket,
            logGroup,
            addRoute(routePath: string) {
                routePaths.push(routePath);
                for (const listener of routeListeners) {
                    listener(routePath);
                }
            },
            onRoute(listener: (routePath: string) => void) {
                for (const routePath of routePaths) {
                    listener(routePath);
                }
                routeListeners.push(listener);
            }
        };
    }
});

/**
 * A web function runs outside the VPC. Its outbound traffic enters the VPC through an egress network
 * connector: network interfaces in the given subnets, with the given security groups, created and
 * managed by Lambda through the operator role. Same subnets and security groups as the regular
 * Lambdas, so the connector's traffic gets the same routes (NAT gateway, VPC endpoints) and the same
 * access to VPC-only resources such as OpenSearch.
 */
function createNetworkConnector(app: PulumiApp, vpc: GraphqlWebVpc) {
    const operatorRole = app.addResource(aws.iam.Role, {
        name: "graphql-web-network-connector-operator",
        config: {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        // The Lambda docs name `lambda.amazonaws.com`, the provider's example names
                        // `network-connectors.lambda.amazonaws.com`. Trusting both covers either.
                        Principal: {
                            Service: [
                                "lambda.amazonaws.com",
                                "network-connectors.lambda.amazonaws.com"
                            ]
                        },
                        Action: "sts:AssumeRole"
                    }
                ]
            })
        }
    });

    const operatorPolicy = app.addResource(aws.iam.RolePolicy, {
        name: "graphql-web-network-connector-operator-policy",
        config: {
            role: operatorRole.output.id,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "CreateENI",
                        Effect: "Allow",
                        Action: "ec2:CreateNetworkInterface",
                        Resource: [
                            "arn:aws:ec2:*:*:network-interface/*",
                            "arn:aws:ec2:*:*:subnet/*",
                            "arn:aws:ec2:*:*:security-group/*"
                        ]
                    },
                    {
                        Sid: "TagENI",
                        Effect: "Allow",
                        Action: "ec2:CreateTags",
                        Resource: "arn:aws:ec2:*:*:network-interface/*",
                        Condition: {
                            StringEquals: {
                                "ec2:ManagedResourceOperator":
                                    "network-connectors.lambda.amazonaws.com"
                            }
                        }
                    }
                ]
            })
        }
    });

    return app.addResource(aws.lambda.CoreNetworkConnector, {
        name: "graphql-web-network-connector",
        config: {
            operatorRole: operatorRole.output.arn,
            configuration: {
                vpcEgressConfiguration: {
                    associatedComputeResourceTypes: ["WebFunction"],
                    networkProtocol: "IPv4",
                    subnetIds: vpc.subnetIds,
                    securityGroupIds: vpc.securityGroupIds
                }
            }
        },
        // Lambda assumes the role while it creates the network interfaces.
        opts: { dependsOn: [operatorPolicy.output] }
    });
}

/**
 * The `graphql` Lambda's final environment, read from its output so that variables added later (by a
 * project's `ApiPulumi` handler, for example) reach the web function too. The web function rejects a
 * variable with an empty value, so those are left out; several usually are (OpenSearch, Okta).
 */
function getWebFunctionEnvVariables(graphqlEnvironment: aws.lambda.Function["environment"]) {
    return graphqlEnvironment.apply(environment => {
        const graphqlVariables = environment?.variables ?? {};
        const nodeOptions = [graphqlVariables.NODE_OPTIONS, "--max-old-space-size=1536"]
            .filter(Boolean)
            .join(" ");

        const variables: Record<string, string | undefined> = {
            ...graphqlVariables,
            AWS_LAMBDA_NODEJS_ENTRYPOINT: "index.mjs",
            NODE_OPTIONS: nodeOptions
        };

        const result: Record<string, string> = {};
        for (const [name, value] of Object.entries(variables)) {
            if (value === undefined || value === null || value === "") {
                continue;
            }
            result[name] = value;
        }
        return result;
    });
}
