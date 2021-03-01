import * as aws from "@pulumi/aws";

class HeadlessCMSTables {
    dataTable: aws.dynamodb.Table;
    esTable: aws.dynamodb.Table;

    constructor(elasticDomain: aws.elasticsearch.Domain, streamTarget: aws.lambda.Function) {
        /**
         * Create a table that will hold all Headless CMS related data
         */
        this.dataTable = new aws.dynamodb.Table("webiny-headless", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" },
                { name: "GSI1_PK", type: "S" },
                { name: "GSI1_SK", type: "S" }
            ],
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK",
            readCapacity: 0,
            writeCapacity: 0,
            globalSecondaryIndexes: [
                {
                    name: "GSI1",
                    hashKey: "GSI1_PK",
                    rangeKey: "GSI1_SK",
                    projectionType: "ALL",
                    readCapacity: 0,
                    writeCapacity: 0
                }
            ]
        });

        /**
         * Create a table for Headles CMS Elasticsearch records.
         */
        this.esTable = new aws.dynamodb.Table("webiny-headless-es", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" }
            ],
            streamEnabled: true,
            streamViewType: "NEW_AND_OLD_IMAGES",
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK",
            readCapacity: 0,
            writeCapacity: 0
        });

        new aws.lambda.EventSourceMapping("headless-dynamo-to-elastic", {
            eventSourceArn: this.esTable.streamArn,
            functionName: streamTarget.arn,
            startingPosition: "LATEST",
            maximumRetryAttempts: 3,
            batchSize: 2000
        });
    }
}

export default HeadlessCMSTables;
