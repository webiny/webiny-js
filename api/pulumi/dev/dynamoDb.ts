import * as aws from "@pulumi/aws";

class DynamoDB {
    table: aws.dynamodb.Table;
    constructor() {
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
            globalSecondaryIndexes: [
                {
                    name: "GSI1",
                    hashKey: "GSI1_PK",
                    rangeKey: "GSI1_SK",
                    projectionType: "ALL"
                }
            ]
        });
    }
}

export default DynamoDB;
