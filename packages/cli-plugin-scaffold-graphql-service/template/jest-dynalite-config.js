module.exports = {
    tables: [
        {
            TableName: "TargetTable",
            KeySchema: [{ AttributeName: "PK", KeyType: "HASH" }],
            AttributeDefinitions: [{ AttributeName: "PK", AttributeType: "S" }],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
        }
    ],
    basePort: 8000
};
