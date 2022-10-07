import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {
    createAppModule,
    PulumiApp,
    PulumiAppResource,
    PulumiAppResourceConstructor,
    PulumiAppRemoteResource
} from "@webiny/pulumi";

import { getAwsAccountId } from "../awsUtils";
import { CoreVpc } from "./CoreVpc";

export interface OpenSearchParams {
    protect: boolean;
}

/**
 * THIS MODULE IS CURRENTLY NOT USED!!
 * At the time of writing, Pulumi will NOT generate a unique suffix for the OpenSearch domain name.
 */

export const OpenSearch = createAppModule({
    name: "OpenSearch",
    config(app, params: OpenSearchParams) {
        const domainName = "webiny-js";
        const accountId = getAwsAccountId(app);

        const vpc = app.getModule(CoreVpc, { optional: true });

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
            // Regular OpenSearch deployment.
            domain = app.addResource(aws.opensearch.Domain, {
                name: domainName,
                config: {
                    domainName,
                    engineVersion: "OpenSearch_1.2",
                    clusterConfig: {
                        instanceType: "t3.medium.search",
                        instanceCount: 2,
                        zoneAwarenessEnabled: true,
                        zoneAwarenessConfig: {
                            availabilityZoneCount: 2
                        }
                    },
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
            domainPolicy = app.addResource(aws.opensearch.DomainPolicy, {
                name: `${domainName}-policy`,
                config: {
                    domainName: domain.output.domainName,
                    accessPolicies: pulumi.interpolate`{
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": "${accountId}"
                                },
                                "Action": "es:*",
                                "Resource": "${domain.output.arn}/*"
                            }
                        ]
                    }`
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
            }
        });

        const policy = getDynamoDbToElasticLambdaPolicy(app, domain.output);

        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-DynamoDbToElasticLambdaPolicy`,
            config: {
                role: role.output,
                policyArn: policy.output.arn
            }
        });

        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-AWSLambdaVPCAccessExecutionRole`,
            config: {
                role: role.output,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
            }
        });

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
                runtime: "nodejs14.x",
                handler: "handler.handler",
                timeout: 600,
                memorySize: 512,
                environment: {
                    variables: {
                        DEBUG: String(process.env.DEBUG),
                        ELASTIC_SEARCH_ENDPOINT: domain.output.endpoint
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
                batchSize: 1000,
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
                            "es:ESHttpDelete",
                            "es:ESHttpPatch",
                            "es:ESHttpPost",
                            "es:ESHttpPut"
                        ],
                        Resource: [
                            pulumi.interpolate`${domain.arn}`,
                            pulumi.interpolate`${domain.arn}/*`
                        ]
                    }
                ]
            }
        }
    });
}
