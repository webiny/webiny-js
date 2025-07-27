/**
 * Important documents to read:
 *
 * https://docs.aws.amazon.com/opensearch-service/latest/developerguide/limits.html#network-limits
 */
import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
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

export interface ElasticSearchParams {
    protect: boolean;
}

function getDevClusterConfig(): aws.types.input.elasticsearch.DomainClusterConfig {
    return {
        instanceType: "t3.small.elasticsearch"
    };
}

function getProdClusterConfig(): aws.types.input.elasticsearch.DomainClusterConfig {
    return {
        // For production deployments, we create 2 instances and configure multi-AZ.
        instanceType: "t3.medium.elasticsearch",
        instanceCount: 2,
        zoneAwarenessEnabled: true,
        zoneAwarenessConfig: {
            availabilityZoneCount: 2
        }
    };
}

export const ElasticSearch = createAppModule({
    name: "ElasticSearch",
    config(app, params: ElasticSearchParams) {
        const domainName = "webiny-js";
        const accountId = getAwsAccountId(app);

        const productionEnvironments =
            app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;
        const isProduction = productionEnvironments.includes(app.params.run.env);

        const vpc = app.getModule(CoreVpc, { optional: true });

        const logDynamoDbTable = app.getModule(LogDynamo);

        // This needs to be implemented in order to be able to use a shared ElasticSearch cluster.
        let domain:
            | PulumiAppResource<PulumiAppResourceConstructor<aws.elasticsearch.Domain>>
            | PulumiAppRemoteResource<aws.elasticsearch.GetDomainResult>;

        let domainPolicy;

        if (process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME) {
            const domainName = String(process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME);
            // This can be useful for testing purposes in ephemeral environments. More information here:
            // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
            domain = app.addRemoteResource(domainName, () => {
                return aws.elasticsearch.getDomain({ domainName }, { async: true });
            });
        } else {
            // Regular ElasticSearch deployment.
            domain = app.addResource(aws.elasticsearch.Domain, {
                name: domainName,
                config: {
                    elasticsearchVersion: "7.10",
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
             * Domain policy defines who can access your Elasticsearch Domain.
             * For details on Elasticsearch security, read the official documentation:
             * https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/security.html
             */
            domainPolicy = app.addResource(aws.elasticsearch.DomainPolicy, {
                name: `${domainName}-policy`,
                config: {
                    domainName: domain.output.domainName,
                    accessPolicies: {
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
                                Resource: pulumi.interpolate`${domain.output.arn}/*`
                            }
                        ]
                    }
                },
                opts: { protect: params.protect }
            });
        }

        /**
         * Create a table for Elasticsearch records. All ES records are stored in this table to dramatically improve
         * performance and stability on write operations (especially massive data imports). This table also serves as a backup and
         * a single source of truth for your Elasticsearch domain. Streaming is enabled on this table, and it will
         * allow asynchronous synchronization of data with Elasticsearch domain.
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
         * This Lambda will process the stream events from DynamoDB table that contains Elasticsearch items.
         * Elasticsearch can't take large amount of individual writes in a short period of time, so this way
         * we store data for Elasticsearch in a DynamoDB table, and asynchronously insert it into Elasticsearch
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
            elasticsearchDynamodbTableName: table.output.name,
            elasticsearchDynamoToElasticLambdaName: lambda.output.name
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
    domain: pulumi.Output<aws.elasticsearch.Domain | aws.elasticsearch.GetDomainResult>
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
