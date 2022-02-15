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
        Key: {
            PK: `DOMAIN#${requestedDomain}`,
            SK: "A"
        }
    };

    const { Item } = await documentClient.get(params).promise();

    if (Item) {
        const from = request.uri.endsWith("/") ? request.uri : request.uri + "/";
        request.uri = `/${Item.tenant}${from}`;

        console.log(`Rewriting request from "${from}" to "${request.uri}"`);
    } else {
        console.log(`Failed to find a tenant for domain "${requestedDomain}"`);
    }
    // Restore the Host header
    request.headers.host[0].value = originDomain;

    return request;
};
