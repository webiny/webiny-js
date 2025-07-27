/**
 * Important documents to read:
 *
 * https://docs.aws.amazon.com/opensearch-service/latest/developerguide/limits.html#network-limits
 */
import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";
import {
    createAppModule,
    PulumiApp,
    PulumiAppRemoteResource,
    PulumiAppResource,
    PulumiAppResourceConstructor
} from "@webiny/pulumi";

import { getAwsAccountId } from "../awsUtils";
import { CoreVpc } from "./CoreVpc";
import { DEFAULT_PROD_ENV_NAMES, LAMBDA_RUNTIME } from "~/constants";
import { LogDynamo } from "~/apps/core/LogDynamo";

export interface OpenSearchParams {
    protect: boolean;
}

function getDevClusterConfig(): aws.types.input.opensearch.DomainClusterConfig {
    return {
        instanceType: "t3.small.search"
    };
}

function getProdClusterConfig(): aws.types.input.opensearch.DomainClusterConfig {
    return {
        // For production deployments, we create 2 instances and configure multi-AZ.
        instanceType: "t3.medium.search",
        instanceCount: 2,
        zoneAwarenessEnabled: true,
        zoneAwarenessConfig: {
            availabilityZoneCount: 2
        }
    };
}

const OS_ENGINE_VERSION = "OpenSearch_2.11";

export const OpenSearch = createAppModule({
    name: "OpenSearch",
    config(app, params: OpenSearchParams) {
        const productionEnvironments =
            app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;
        const isProduction = productionEnvironments.includes(app.params.run.env);

        const vpc = app.getModule(CoreVpc, { optional: true });

        const logDynamoDbTable = app.getModule(LogDynamo);

        // This needs to be implemented in order to be able to use a shared OpenSearch cluster.
        let domain:
            | PulumiAppResource<PulumiAppResourceConstructor<aws.opensearch.Domain>>
            | PulumiAppRemoteResource<aws.opensearch.GetDomainResult>;

        let domainPolicy;

        if (process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME) {
            const domainName = String(process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME);
            // This can be useful for testing purposes in ephemeral environments. More information here:
            // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
            domain = app.addRemoteResource(domainName, () => {
                return aws.opensearch.getDomain({ domainName }, { async: true });
            });
        } else {
            const randomId = new random.RandomId("osDomainRandomId", { byteLength: 8 });
            const namePrefix = app.getParam(app.params.create.pulumiResourceNamePrefix) || "";

            const domainLogicalName = "webiny-js";
            const domainPhysicalName = randomId.hex.apply((hex: string) => {
                return `${namePrefix}${domainLogicalName}-${hex.slice(-7)}`;
            });

            domain = app.addResource(aws.opensearch.Domain, {
                name: domainLogicalName,
                config: {
                    domainName: domainPhysicalName,
                    engineVersion: OS_ENGINE_VERSION,
                    clusterConfig: isProduction ? getProdClusterConfig() : getDevClusterConfig(),
                    vpcOptions: vpc
                        ? {
                              subnetIds: vpc.subnets.private.map(s => s.output.id),
                              securityGroupIds: [vpc.vpc.output.defaultSecurityGroupId]
                          }
                        : undefined,
                    ebsOptions: {
                        ebsEnabled: true,
                        volumeSize: 10,
                        volumeType: "gp2"
                    },
                    advancedOptions: {
                        "rest.action.multi.allow_explicit_index": "true"
                    },
                    snapshotOptions: {
                        automatedSnapshotStartHour: 23
                    }
                },
                opts: { protect: params.protect }
            });

            /**
             * Domain policy defines who can access your OpenSearch Domain.
             * For details on OpenSearch security, read the official documentation:
             * https://docs.aws.amazon.com/openSearch-service/latest/developerguide/security.html
             */
            const accountId = getAwsAccountId(app);

            domainPolicy = app.addResource(aws.opensearch.DomainPolicy, {
                name: `${domainLogicalName}-policy`,
                config: {
                    domainName: domain.output.domainName,
                    accessPolicies: pulumi
                        .all([accountId, domain.output.arn])
                        .apply(([accountId, domainArn]) => {
                            return JSON.stringify({
                                Version: "2012-10-17",
                                Statement: [
                                    /**
                                     * Allow requests signed with current account
                                     */
                                    {
                                        Effect: "Allow",
                                        Principal: {
                                            AWS: accountId
                                        },
                                        Action: "es:*",
                                        Resource: `${domainArn}/*`
                                    }
                                ]
                            });
                        })
                },
                opts: { protect: params.protect }
            });
        }

        /**
         * Create a table for OpenSearch records. All ES records are stored in this table to dramatically improve
         * performance and stability on write operations (especially massive data imports). This table also serves as a backup and
         * a single source of truth for your OpenSearch domain. Streaming is enabled on this table, and it will
         * allow asynchronous synchronization of data with OpenSearch domain.
         */
        const table = app.addResource(aws.dynamodb.Table, {
            name: "webiny-es",
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" }
                ],
                streamEnabled: true,
                streamViewType: "NEW_AND_OLD_IMAGES",
                billingMode: "PAY_PER_REQUEST",
                hashKey: "PK",
                rangeKey: "SK"
            },
            opts: { protect: params.protect }
        });

        const roleName = "dynamo-to-elastic-lambda-role";

        const role = app.addResource(aws.iam.Role, {
            name: roleName,
            config: {
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
            },
            meta: { isLambdaFunctionRole: true }
        });

        const policy = getDynamoDbToElasticLambdaPolicy(app, domain.output);

        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-DynamoDbToElasticLambdaPolicy`,
            config: {
                role: role.output,
                policyArn: policy.output.arn
            }
        });

        // Only use `AWSLambdaVPCAccessExecutionRole` policy if VPC feature is enabled.
        if (vpc) {
            app.addResource(aws.iam.RolePolicyAttachment, {
                name: `${roleName}-AWSLambdaVPCAccessExecutionRole`,
                config: {
                    role: role.output,
                    policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
                }
            });
        } else {
            app.addResource(aws.iam.RolePolicyAttachment, {
                name: `${roleName}-AWSLambdaBasicExecutionRole`,
                config: {
                    role: role.output,
                    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
                }
            });
        }

        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-AWSLambdaDynamoDBExecutionRole`,
            config: {
                role: role.output,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaDynamoDBExecutionRole
            }
        });

        /**
         * This Lambda will process the stream events from DynamoDB table that contains OpenSearch items.
         * OpenSearch can't take large amount of individual writes in a short period of time, so this way
         * we store data for OpenSearch in a DynamoDB table, and asynchronously insert it into OpenSearch
         * using batching.
         */
        const lambda = app.addResource(aws.lambda.Function, {
            name: "dynamo-to-elastic",
            config: {
                role: role.output.arn,
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                timeout: 900,
                memorySize: 1024,
                environment: {
                    variables: {
                        DEBUG: String(process.env.DEBUG),
                        ELASTIC_SEARCH_ENDPOINT: domain.output.endpoint,
                        DB_TABLE_LOG: logDynamoDbTable.output.name
                    }
                },
                description: "Process DynamoDB Stream.",
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "dynamoToElastic/build")
                    )
                }),
                vpcConfig: vpc
                    ? {
                          subnetIds: vpc.subnets.private.map(s => s.output.id),
                          securityGroupIds: [vpc.vpc.output.defaultSecurityGroupId]
                      }
                    : undefined
            }
        });

        const eventSourceMapping = app.addResource(aws.lambda.EventSourceMapping, {
            name: "dynamo-to-elastic",
            config: {
                eventSourceArn: table.output.streamArn,
                functionName: lambda.output.arn,
                startingPosition: "LATEST",
                maximumRetryAttempts: 3,
                batchSize: 50,
                maximumBatchingWindowInSeconds: 1
            }
        });

        app.addOutputs({
            elasticsearchDomainArn: domain.output.arn,
            elasticsearchDomainEndpoint: domain.output.endpoint,
            elasticsearchDynamodbTableArn: table.output.arn,
            elasticsearchDynamodbTableName: table.output.name
        });

        return {
            domain,
            domainPolicy,
            table,
            dynamoToElastic: {
                role,
                policy,
                lambda,
                eventSourceMapping
            }
        };
    }
});

function getDynamoDbToElasticLambdaPolicy(
    app: PulumiApp,
    domain: pulumi.Output<aws.opensearch.Domain | aws.opensearch.GetDomainResult>
) {
    const logDynamoDbTable = app.getModule(LogDynamo);

    return app.addResource(aws.iam.Policy, {
        name: "DynamoDbToElasticLambdaPolicy-updated",
        config: {
            description: "This policy enables access to ES and Dynamodb streams",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForES",
                        Effect: "Allow",
                        Action: [
                            "es:ESHttpGet",
                            "es:ESHttpDelete",
                            "es:ESHttpPatch",
                            "es:ESHttpPost",
                            "es:ESHttpPut"
                        ],
                        Resource: [
                            pulumi.interpolate`${domain.arn}`,
                            pulumi.interpolate`${domain.arn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForDynamoDbLog",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:Scan",
                            "dynamodb:Query"
                        ],
                        Resource: [
                            pulumi.interpolate`${logDynamoDbTable.output.arn}`,
                            pulumi.interpolate`${logDynamoDbTable.output.arn}/*`
                        ]
                    }
                ]
            }
        }
    });
}
