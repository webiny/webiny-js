import { describe, it, expect } from "vitest";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { CmsDdbDataLoaders } from "@webiny/api-headless-cms-ddb/abstractions/CmsDdbDataLoaders.js";
import { createAwsDdbApiHandler } from "~/createWebinyApiHandler.js";

/**
 * The handler keeps one root container per Lambda instance and runs every request in a child
 * container. The CMS entry DataLoaders cache reads, so each request must get its own; a loader shared
 * through the root served stale entries on every instance that had not done the write itself.
 *
 * Extensions register on the request container, so a probe extension sees exactly what the CMS
 * storage operations of that request resolve.
 */
describe("api-event-handler-aws-ddb — CMS DataLoaders scope", () => {
    it("gives every request its own DataLoaders", async () => {
        const seen: CmsDdbDataLoaders.Interface[][] = [];

        const probe = createRegisterExtensionPlugin(({ container }) => {
            const first = container.resolve(CmsDdbDataLoaders);
            const second = container.resolve(CmsDdbDataLoaders);
            seen.push([first, second]);
        });

        const documentClient = getDocumentClient();
        const handler = createAwsDdbApiHandler({
            extensions: () => [probe],
            documentClient
        });

        const sendRequest = async (requestId: string) => {
            const body = JSON.stringify({ query: "{ __typename }" });
            return handler({
                httpMethod: "POST",
                path: "/graphql",
                headers: {
                    "content-type": "application/json",
                    "x-tenant": "root"
                },
                requestContext: { requestId },
                body,
                isBase64Encoded: false
            });
        };

        await sendRequest("test-req-loaders-1");
        await sendRequest("test-req-loaders-2");

        expect(seen).toHaveLength(2);

        const [firstRequest, secondRequest] = seen;

        expect(firstRequest[1]).toBe(firstRequest[0]);
        expect(secondRequest[0]).not.toBe(firstRequest[0]);
    });
});
