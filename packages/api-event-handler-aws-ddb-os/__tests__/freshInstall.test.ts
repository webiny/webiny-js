import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createHandler } from "./createHandler.js";

/**
 * Boots createAwsDdbOsApiHandler against an empty DynamoDB and sends a GraphQL request. On a fresh
 * database the CMS content models don't exist yet, so this catches composition and fresh-install
 * wiring bugs (a feature that fails to register, a broken base schema) before an e2e deploy.
 */
describe("api-event-handler-aws-ddb-os — full handler boot (fresh install)", () => {
    it("builds the GraphQL schema on a fresh DB without a DI wiring failure", async () => {
        const graphql = createHandler(() => []);

        const result = await graphql("{ __typename }");

        expect(result.raw).not.toContain("No registration found");
        expect(result.statusCode).toBeLessThan(500);
        expect(result.body?.data?.__typename).toBe("Query");
    });
});
