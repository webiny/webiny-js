const { DocumentClient } = require("aws-sdk/clients/dynamodb");

// Since Lambda@Edge doesn't support ENV variables, the easiest way to pass
// config values to it is to inject them into the source code before deploy.
const DB_TABLE_NAME = "{DB_TABLE_NAME}";
const DB_TABLE_REGION = "{DB_TABLE_REGION}";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: DB_TABLE_REGION
});

function sanitizeRequestURI(uri) {
    // Make sure that `/` is not appended to index.html, or any path with extension.
    // We remove all slashes, filter out empty values, and reconstruct the path following
    // the fact that every page (slug) has a dedicated folder in the S3 bucket, and an `index.html`
    // file with the actual page HTML.
    const parts = uri.split("/").filter(Boolean);

    // This means that a `/` (homepage) was requested. When the homepage is prerendered, we place its files
    // into the root of the tenant subfolder, e.g., `/root/index.html`.
    if (!parts.length) {
        return "/index.html";
    }

    const lastPart = parts[parts.length - 1];

    // If there's a `.` in the last part of the path, we assume it's a file extension.
    // In this case, we can reconstruct the path by joining parts with slashes.
    if (lastPart.includes(".")) {
        return ["", ...parts].join("/");
    }

    // Otherwise, we assume it's a page slug, which needs to point to page's subfolder.
    // We construct a valid S3 bucket path to an HTML file.
    return ["", ...parts, "index.html"].join("/");
}

async function handleOriginRequest(request) {
    const requestedDomain = request.headers.host[0].value;
    const originDomain = request.origin.custom.domainName;

    // Find tenant by domain. This record is stored to the DB using the Tenant Manager app.
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

        // To be on the safe side, make sure the requested uri doesn't already include the tenant ID.
        if (uri.startsWith(`/${Item.tenant}/`)) {
            request.uri = uri;
        } else {
            // Prepend the tenant ID, to point to the correct S3 bucket folder.
            request.uri = `/${Item.tenant}${uri}`;
        }

        console.log(`Rewriting request from "${uri}" to "${request.uri}"`);
    } else {
        console.log(`Failed to find a tenant for domain "${requestedDomain}"`);
    }

    // At this point, the value of the `Host` header is set to the custom domain.
    // Before forwarding the request to the S3 bucket, we need to set the `Host` header
    // to the value of the origin (S3 bucket URL).
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
