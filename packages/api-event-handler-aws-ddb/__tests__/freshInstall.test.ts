import { describe, it, expect } from "vitest";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createWebinyApiHandler } from "~/createWebinyApiHandler.js";

/**
 * Integration test for the full DDB API composition root.
 *
 * Boots createWebinyApiHandler against a fresh (empty) dynalite DynamoDB and sends a GraphQL
 * request. On a fresh DB the CMS content models don't exist yet, so this exercises the exact path
 * that produced `No registration found for FileModel` in production: the GraphQL schema build
 * derefs a schema contributor whose dependency (FileModel) is only registered conditionally.
 *
 * This is the test the untestable app-template comp root never had — it catches composition /
 * fresh-install wiring bugs before an e2e deploy.
 */
describe("api-event-handler-aws-ddb — full handler boot (fresh install)", () => {
    it("builds the GraphQL schema on a fresh DB without a DI wiring failure", async () => {
        const handler = createWebinyApiHandler({
            extensions: () => [],
            documentClient: getDocumentClient(),
            dbTable: process.env.DB_TABLE
        });

        const result = await handler({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                "content-type": "application/json",
                "x-tenant": "root"
            },
            requestContext: { requestId: "test-req-1" },
            body: JSON.stringify({ query: "{ __typename }" }),
            isBase64Encoded: false
        });

        // The handler must not 500 with a DI wiring error during schema build.
        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain("No registration found");
        expect(result.statusCode).toBeLessThan(500);

        // Confirm the base /graphql schema actually built and resolved on a fresh DB — this is the
        // real signal (otherwise the assertions above pass trivially). This alone catches a whole
        // class of comp-root wiring bugs: a feature that fails to register, a broken base schema, or
        // a registration-order regression that breaks the build.
        const parsed = JSON.parse(String(result.body));
        expect(parsed?.data?.__typename).toBe("Query");
    });
});
