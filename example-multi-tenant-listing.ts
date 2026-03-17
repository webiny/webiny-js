/**
 * Example: List CMS Entries from Different Tenants
 *
 * This example demonstrates how to use the Webiny SDK to list entries
 * from different tenants. Each tenant requires its own API key.
 *
 * Usage:
 *   1. Paste your API keys directly in the TENANTS array below, OR
 *   2. Set environment variables:
 *      export WEBINY_API_URL="https://your-api.webiny.io"
 *      export TENANT_ROOT_API_KEY="your-root-api-key"
 *      export TENANT_TEN2_API_KEY="your-ten2-api-key"
 *   3. Run: npx tsx example-multi-tenant-listing.ts
 */

import { Webiny } from "@webiny/sdk";

async function main() {
    console.log("=== Multi-Tenant CMS Entry Listing Example ===\n");

    // ========================================================================
    // Configuration - Each tenant needs its own API key
    // ========================================================================

    const API_ENDPOINT = process.env.WEBINY_API_URL || "https://d30teiquap5bu2.cloudfront.net";

    // Define the content model to query
    const MODEL_ID = "product"; // Change this to your model ID

    // Configure tenants with their respective API keys
    const TENANTS = [
        {
            name: "root",
            apiKey: process.env.TENANT_ROOT_API_KEY || "wat_531bdc281ee4b3bbec4b9a91cf09ccfaf79f"
        },
        {
            name: "ten2",
            apiKey: process.env.TENANT_TEN2_API_KEY || "wat_aeccc5e8a4662ef0c9eeef268d13c7c05a13"
        }
    ];

    console.log(`API Endpoint: ${API_ENDPOINT}`);
    console.log(`Model ID: ${MODEL_ID}`);
    console.log(`Tenants: ${TENANTS.map(t => t.name).join(", ")}\n`);

    // ========================================================================
    // List Entries from Multiple Tenants
    // ========================================================================

    for (const tenant of TENANTS) {
        console.log(`\n📂 Fetching entries from tenant: "${tenant.name}"`);
        console.log("─".repeat(60));

        // Create SDK instance for this specific tenant with its own API key
        const sdk = new Webiny({
            endpoint: API_ENDPOINT,
            token: tenant.apiKey,
            tenant: tenant.name
        });

        try {
            // List entries with field selection
            const result = await sdk.cms.listEntries({
                modelId: MODEL_ID,
                preview: true,
                fields: ["id", "entryId", "values.name"],
                limit: 5,
                sort: {
                    createdOn: "desc"
                }
            });

            if (result.isOk()) {
                const { data, meta } = result.value;

                console.log(`✅ Found ${data.length} entries (Total: ${meta.totalCount})`);

                if (data.length > 0) {
                    console.log("\nEntries:");
                    data.forEach((entry, index) => {
                        console.log(`  ${index + 1}. ${entry.values?.name || "Untitled"}`);
                        console.log(`     ID: ${entry.id}`);
                        console.log(`     Entry ID: ${entry.entryId}`);
                    });
                } else {
                    console.log("  No entries found.");
                }

                if (meta.hasMoreItems) {
                    console.log(`\n  📄 More items available (cursor: ${meta.cursor})`);
                }
            } else {
                console.error(`❌ Error fetching entries: ${result.error.message}`);
                if (result.error instanceof Error) {
                    console.error(`   Details: ${result.error.message}`);
                }
            }
        } catch (error) {
            console.error(`❌ Unexpected error: ${error}`);
        }
    }

    // ========================================================================
    // Summary: Compare Entry Counts Across Tenants
    // ========================================================================

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary: Entry Counts by Tenant");
    console.log("=".repeat(60));

    for (const tenant of TENANTS) {
        const sdk = new Webiny({
            endpoint: API_ENDPOINT,
            token: tenant.apiKey,
            tenant: tenant.name
        });

        const result = await sdk.cms.listEntries({
            modelId: MODEL_ID,
            preview: true,
            fields: ["id"], // Minimal field selection for count
            limit: 1
        });

        if (result.isOk()) {
            console.log(`  ${tenant.name.padEnd(20)}: ${result.value.meta.totalCount} entries`);
        } else {
            console.log(`  ${tenant.name.padEnd(20)}: Error fetching count`);
        }
    }

    console.log("\n=== Example Complete ===");
}

// Run the example
main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
