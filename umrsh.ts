const aws = require("aws-sdk");
const converter = aws.DynamoDB.Converter;
const fs = require("fs");

const DIR = "./packages/migrations/__tests__/migrations/5.39.0/002/ddb-es/";
const FILE = "002.ddbPrimaryTableData.ts";
const obj = require(DIR + FILE)["ddbPrimaryTableData"];

for (const current of obj) {
    for (const key in current) {
        if (typeof current[key] === "object") {
            current[key] = converter.unmarshall(current[key]);
        }
    }
}

fs.writeFileSync(FILE, JSON.stringify(obj, null, 2));
