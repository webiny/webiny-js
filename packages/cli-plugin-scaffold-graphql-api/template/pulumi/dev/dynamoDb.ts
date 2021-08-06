import * as aws from "@pulumi/aws";

class DynamoDB {
    table: aws.dynamodb.Table;
    constructor() {
        this.table = new aws.dynamodb.Table("webiny", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" }
            ],
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK",
            globalSecondaryIndexes: []
        });
    }
}

export default DynamoDB;
