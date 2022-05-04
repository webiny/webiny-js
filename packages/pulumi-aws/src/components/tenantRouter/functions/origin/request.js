const { DocumentClient } = require("aws-sdk/clients/dynamodb");

const DB_TABLE_NAME = "{DB_TABLE_NAME}";
const DB_TABLE_REGION = "{DB_TABLE_REGION}";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: DB_TABLE_REGION
});

function sanitizeRequestURI(uri) {
    // Make sure that / is not appended to index.html, or any path with extension.
    const parts = uri.split("/").filter(Boolean);

    if (!parts.length) {
        return "/index.html";
    }

    const lastPart = parts[parts.length - 1];

    if (lastPart.includes(".")) {
        return ["", ...parts].join("/");
    } // Otherwise, construct a valid S3 bucket path to an HTML file.

    return ["", ...parts, "index.html"].join("/");
}

async function handleOriginRequest(request) {
    const requestedDomain = request.headers.host[0].value;
    const originDomain = request.origin.custom.domainName; // Find tenant by domain

    const params = {
        TableName: DB_TABLE_NAME,
        Key: {
            PK: `DOMAIN#${requestedDomain}`,
            SK: "A"
        }
    };
    const { Item } = await documentClient.get(params).promise();

    if (Item) {
        const uri = sanitizeRequestURI(request.uri);

        if (uri.startsWith(`/${Item.tenant}/`)) {
            // Don't include tenant ID twice.
            request.uri = uri;
        } else {
            // Append tenant ID to point to the correct S3 bucket folder.
            request.uri = `/${Item.tenant}${uri}`;
        }

        console.log(`Rewriting request from "${uri}" to "${request.uri}"`);
    } else {
        console.log(`Failed to find a tenant for domain "${requestedDomain}"`);
    } // Restore the Host header

    request.headers.host[0].value = originDomain;
    return request;
}

exports.handler = async event => {
    const { request, config } = event.Records[0].cf;

    if (config.eventType === "origin-request") {
        return handleOriginRequest(request);
    }

    return request;
};
