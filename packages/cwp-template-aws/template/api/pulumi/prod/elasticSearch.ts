import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class ElasticSearch {
    domain: aws.elasticsearch.Domain;
    table: aws.dynamodb.Table;

    constructor({ protectedEnvironment }: { protectedEnvironment: boolean }) {
        const domainName = "webiny-js";

        this.domain = new aws.elasticsearch.Domain(
            domainName,
            {
                elasticsearchVersion: "7.7",
                clusterConfig: {
                    instanceType: "t3.medium.elasticsearch",
                    instanceCount: 2,
                    zoneAwarenessEnabled: true,
                    zoneAwarenessConfig: {
                        availabilityZoneCount: 2
                    }
                },
                vpcOptions: {
                    subnetIds: [vpc.subnets.private[0].id, vpc.subnets.private[1].id],
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                },
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
            { protect: protectedEnvironment }
        );

        /**
         * Domain policy defines who can access your Elasticsearch Domain.
         * For details on Elasticsearch security, read the official documentation:
         * https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/security.html
         */
        new aws.elasticsearch.DomainPolicy(
            `${domainName}-policy`,
            {
                domainName: this.domain.domainName.apply(v => `${v}`),
                accessPolicies: Promise.all([aws.getCallerIdentity({})]).then(
                    ([currentCallerIdentity]) => ({
                        Version: "2012-10-17",
                        Statement: [
                            /**
                             * Allow requests signed with current account
                             */
                            {
                                Effect: "Allow",
                                Principal: {
                                    AWS: currentCallerIdentity.accountId
                                },
                                Action: "es:*",
                                Resource: this.domain.arn.apply(v => `${v}/*`)
                            }
                        ]
                    })
                )
            },
            { protect: protectedEnvironment }
        );

        /**
         * Create a table for Elasticsearch records. All ES records are stored in this table to dramatically improve
         * performance and stability on write operations (especially massive data imports). This table also serves as a backup and
         * a single source of truth for your Elasticsearch domain. Streaming is enabled on this table, and it will
         * allow asynchronous synchronization of data with Elasticsearch domain.
         */
        this.table = new aws.dynamodb.Table(
            "webiny-es",
            {
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
            { protect: protectedEnvironment }
        );

        /**
         * This Lambda will process the stream events from DynamoDB table that contains Elasticsearch items.
         * Elasticsearch can't take large amount of individual writes in a short period of time, so this way
         * we store data for Elasticsearch in a DynamoDB table, and asynchronously insert it into Elasticsearch
         * using batching.
         */
        const streamTarget = new aws.lambda.Function("dynamo-to-elastic", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 600,
            memorySize: 512,
            environment: {
                variables: {
                    DEBUG: String(process.env.DEBUG),
                    ELASTIC_SEARCH_ENDPOINT: this.domain.endpoint
                }
            },
            description: "Process DynamoDB Stream.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/dynamoToElastic/build")
            }),
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        new aws.lambda.EventSourceMapping("dynamo-to-elastic", {
            eventSourceArn: this.table.streamArn,
            functionName: streamTarget.arn,
            startingPosition: "LATEST",
            maximumRetryAttempts: 3,
            batchSize: 1000,
            maximumBatchingWindowInSeconds: 1
        });
    }
}

export default ElasticSearch;
