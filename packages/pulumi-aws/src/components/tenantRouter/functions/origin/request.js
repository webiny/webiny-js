const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocument, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

// Since Lambda@Edge doesn't support ENV variables, the easiest way to pass
// config values to it is to inject them into the source code before deploy.
const DB_TABLE_NAME = "{DB_TABLE_NAME}";
const DB_TABLE_REGION = "{DB_TABLE_REGION}";

const client = new DynamoDBClient({
    region: DB_TABLE_REGION
});

const documentClient = DynamoDBDocument.from(client, {
    marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true
    }
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

async function getTenantIdByDomain(domain) {
    const cmd = new GetCommand({
        TableName: DB_TABLE_NAME,
        Key: {
            PK: `DOMAIN#${domain}`,
            SK: "A"
        }
    });

    const { Item } = await documentClient.send(cmd);
    return Item ? Item.tenant : undefined;
}

/**
 * Check if "root" tenant has at least one child tenant.
 */
async function hasMultipleTenants() {
    const cmd = new QueryCommand({
        TableName: DB_TABLE_NAME,
        IndexName: "GSI1",
        Limit: 1,
        Select: "COUNT",
        KeyConditionExpression: "GSI1_PK = :GSI1_PK and begins_with(GSI1_SK, :GSI1_SK)",
        ExpressionAttributeValues: {
            ":GSI1_PK": "TENANTS",
            ":GSI1_SK": "T#root#"
        }
    });

    const { Count } = await documentClient.send(cmd);

    return Count > 0;
}

async function handleOriginRequest(request) {
    const origin = request.origin;
    const isCustomOrigin = Boolean(origin.custom);
    const requestedDomain = request.headers.host[0].value;
    const originDomain = isCustomOrigin ? origin.custom.domainName : origin.s3.domainName;

    let tenant;
    if (await hasMultipleTenants()) {
        // Find tenant by domain. This record is stored to the DB using the Tenant Manager app.
        console.log(`Multiple tenants are present; loading by domain...`);
        tenant = await getTenantIdByDomain(requestedDomain);
    } else {
        console.log(`Only one tenant is present; falling back to "root".`);
        // If the system only has one tenant, we don't need to map by domain at all.
        tenant = "root";
    }

    if (tenant) {
        const uri = sanitizeRequestURI(request.uri);

        // To be on the safe side, make sure the requested uri doesn't already include the tenant ID.
        if (uri.startsWith(`/${tenant}/`)) {
            request.uri = uri;
        } else {
            // Prepend the tenant ID, to point to the correct S3 bucket folder.
            request.uri = `/${tenant}${uri}`;
        }

        console.log(`Rewriting request from "${uri}" to "${request.uri}"`);
    } else {
        console.log(`Failed to find a tenant for domain "${requestedDomain}"`);
        return {
            status: 400,
            statusDescription: "Unable to map tenant. Check your tenant to domain mapping."
        };
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
