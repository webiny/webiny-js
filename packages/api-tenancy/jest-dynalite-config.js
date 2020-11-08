module.exports = {
    tables: [
        {
            TableName: `Tenants`,
            KeySchema: [
                { AttributeName: "PK", KeyType: "HASH" },
                { AttributeName: "SK", KeyType: "RANGE" }
            ],
            AttributeDefinitions: [
                { AttributeName: "PK", AttributeType: "S" },
                { AttributeName: "SK", AttributeType: "S" }
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 50, WriteCapacityUnits: 50 }
        }
    ],
    basePort: 8000
};
