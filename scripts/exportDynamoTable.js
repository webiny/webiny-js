const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const { getDocumentClient } = require("@webiny/aws-sdk/client-dynamodb");

const documentClient = getDocumentClient({
    region: "eu-central-1"
});

const scanTable = async tableName => {
    const params = {
        TableName: tableName
    };

    const scanResults = [];
    let items;
    do {
        items = await documentClient.scan(params).promise();
        items.Items.forEach(item => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    return scanResults;
};

(async () => {
    const { table, output } = yargs.argv;
    const data = await scanTable(table);
    fs.writeFileSync(path.resolve(output), JSON.stringify(data, null, 2));
})();
