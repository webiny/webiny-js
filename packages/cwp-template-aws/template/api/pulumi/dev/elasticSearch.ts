import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import defaultLambdaRole from "./defaultLambdaRole";

class ElasticSearch {
    domain: aws.elasticsearch.Domain;
    table: aws.dynamodb.Table;

    constructor() {
        const domainName = "webiny-js";

        this.domain = new aws.elasticsearch.Domain(domainName, {
            elasticsearchVersion: "7.7",
            clusterConfig: {
                instanceType: "t3.small.elasticsearch"
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
        });

        new aws.elasticsearch.DomainPolicy(`${domainName}-policy`, {
            domainName: this.domain.domainName.apply(v => `${v}`),
            accessPolicies: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: ["es:*"],
                        Principal: {
                            AWS: ["*"]
                        },
                        Effect: "Allow",
                        Resource: this.domain.arn.apply(v => `${v}/*`)
                    }
                ]
            }
        });

        /**
         * Create a table for Elasticsearch records. All ES records are stored in this table to dramatically improve
         * performance and stability on write operations (especially massive data imports). This table also serves as a backup and
         * a single source of truth for your Elasticsearch domain. Streaming is enabled on this table, and it will
         * allow asynchronous synchronization of data with Elasticsearch domain.
         */
        this.table = new aws.dynamodb.Table("webiny-es", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" }
            ],
            streamEnabled: true,
            streamViewType: "NEW_AND_OLD_IMAGES",
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK"
        });

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
            })
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
