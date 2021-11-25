const { DocumentClient } = require("aws-sdk/clients/dynamodb");

const DB_TABLE_NAME = "{DB_TABLE_NAME}";
const DB_TABLE_REGION = "{DB_TABLE_REGION}";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: DB_TABLE_REGION
});

exports.handler = async event => {
    const request = event.Records[0].cf.request;
    // console.log(JSON.stringify(event.Records[0].cf, null, 2));

    const requestedDomain = request.headers.host[0].value;
    const originDomain = request.origin.custom.domainName;

    // Find tenant by domain
    const params = {
        TableName: DB_TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1_PK = :GSI1_PK AND GSI1_SK = :GSI1_SK",
        ExpressionAttributeValues: { ":GSI1_PK": `DOMAIN#${requestedDomain}`, ":GSI1_SK": "A" },
        Limit: 1
    };

    const { Items, Count } = await documentClient.query(params).promise();

    if (Count === 1) {
        const { tenant } = Items[0];
        const from = request.uri;
        request.uri = `/${tenant}${from}`;
        console.log(`Rewriting request from "${from}" to "${request.uri}"`);
    } else {
        console.log(`Failed to find a tenant for domain "${requestedDomain}"`);
    }

    // Restore the Host header
    request.headers.host[0].value = originDomain;

    return request;
};
