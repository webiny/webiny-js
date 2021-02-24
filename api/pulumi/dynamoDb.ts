import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import defaultLambdaRole from "./defaultLambdaRole";

class DynamoDB {
    table: aws.dynamodb.Table;
    elasticTable: aws.dynamodb.Table;
    constructor(elasticsearch: aws.elasticsearch.Domain) {
        this.table = new aws.dynamodb.Table("webiny", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" },
                { name: "GSI1_PK", type: "S" },
                { name: "GSI1_SK", type: "S" }
            ],
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK",
            readCapacity: 1,
            writeCapacity: 1,
            globalSecondaryIndexes: [
                {
                    name: "GSI1",
                    hashKey: "GSI1_PK",
                    rangeKey: "GSI1_SK",
                    projectionType: "ALL",
                    readCapacity: 1,
                    writeCapacity: 1
                }
            ]
        });

        /**
         * Create a separate table for Elasticsearch records.
         */
        this.elasticTable = new aws.dynamodb.Table("webiny-es", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" }
            ],
            streamEnabled: true,
            streamViewType: "NEW_AND_OLD_IMAGES",
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK",
            readCapacity: 1,
            writeCapacity: 1
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
                    ELASTIC_SEARCH_ENDPOINT: elasticsearch.endpoint
                }
            },
            description: "Process DDB Stream.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/dynamoToElastic/build")
            })
        });

        new aws.lambda.EventSourceMapping("dynamo-to-elastic", {
            eventSourceArn: this.elasticTable.streamArn,
            functionName: streamTarget.arn,
            startingPosition: "LATEST",
            maximumRetryAttempts: 3,
            batchSize: 100,
            maximumBatchingWindowInSeconds: 3
        });
    }
}

export default DynamoDB;
