import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createServer } from "./createServer.js";

/**
 * Boots createSqlApiHandler against an empty database and sends a GraphQL request over HTTP. On a
 * fresh database the CMS content models don't exist yet, so this catches composition and
 * fresh-install wiring bugs (a feature that fails to register, a broken base schema) before an e2e
 * deploy.
 */
describe("api-event-handler-standalone-sql — full server boot (fresh install)", () => {
    it("builds the GraphQL schema on a fresh DB without a DI wiring failure", async () => {
        const server = await createServer();

        try {
            const result = await server.graphql("{ __typename }");

            expect(result.raw).not.toContain("No registration found");
            expect(result.statusCode).toBeLessThan(500);
            expect(result.body?.data?.__typename).toBe("Query");
        } finally {
            await server.close();
        }
    });
});
