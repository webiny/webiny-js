import { Sdk } from "dist";

process.env.WEBINY_API_TOKEN = "wat_3e1920c6b236cc42293c5e71f056b45c45c6";
process.env.WEBINY_API_ENDPOINT = "https://d1apdi5r2chnw9.cloudfront.net";

const API_ENDPOINT = process.env.WEBINY_API_ENDPOINT!;
const API_TOKEN = process.env.WEBINY_API_TOKEN!;
const API_TENANT = process.env.WEBINY_API_TENANT || "root";

if (!API_ENDPOINT || !API_TOKEN) {
    throw new Error(
        "Missing required environment variables: WEBINY_API_ENDPOINT and WEBINY_API_TOKEN"
    );
}

// Initialize and export the SDK
export const sdk = new Sdk({
    token: API_TOKEN,
    endpoint: API_ENDPOINT,
    tenant: API_TENANT
});

const result = await sdk.cms.listEntries({
    modelId: "product",
    sort: {
        "values.createdOn": "desc"
    },
    fields: [
        "id",
        "values.name",
        "values.description",
        "values.price",
        "values.sku",
        "values.category.id",
        "values.category.values.name",
        "values.category.values.slug"
    ]
    // Note: For fetching draft/unpublished content, you can use `preview: true`
    // We won't cover this in this lesson, but it's useful for preview environments
});

if (result.isOk()) {
    console.log("Entries:", result.value.data);
} else {
    console.error("Error fetching entries:", result.error);
}
