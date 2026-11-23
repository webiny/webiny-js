import { describe, it, expect } from "vitest";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { Abstraction } from "@webiny/di";
import { AcoFlpCrud } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { CreateFlpUseCase } from "@webiny/api-aco/features/flp/CreateFlp/abstractions.js";
import { UpdateFlpUseCase } from "@webiny/api-aco/features/flp/UpdateFlp/abstractions.js";
import { DeleteFlpUseCase } from "@webiny/api-aco/features/flp/DeleteFlp/abstractions.js";
import { createAwsDdbApiHandler } from "~/createWebinyApiHandler.js";

/**
 * The DynamoDB storage registers the FLP catalog strategy in the root container, but the catalog
 * needs the tenant, the identity and CMS use cases, which exist only in the request container.
 * The catalog used to be built by factories that resolved from the root container, so the first
 * folder permission check of a request failed with "No registration found for TenantContext", and
 * the catalog update use case could not be built at all.
 */
describe("api-event-handler-aws-ddb — FLP catalog", () => {
    it("builds the FLP catalog and its use cases from the request container", async () => {
        const abstractions: Abstraction<unknown>[] = [
            AcoFlpCrud,
            CreateFlpUseCase,
            UpdateFlpUseCase,
            DeleteFlpUseCase
        ];
        const errors: string[] = [];

        const extension = createRegisterExtensionPlugin(({ container }) => {
            for (const abstraction of abstractions) {
                try {
                    container.resolve(abstraction);
                } catch (error) {
                    errors.push(error instanceof Error ? error.message : String(error));
                }
            }
        });

        const handler = createAwsDdbApiHandler({
            extensions: () => [extension],
            documentClient: getDocumentClient()
        });
        await handler({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                "content-type": "application/json",
                "x-tenant": "root"
            },
            requestContext: { requestId: "test-req-flp-catalog" },
            body: JSON.stringify({ query: "{ __typename }" }),
            isBase64Encoded: false
        });

        expect(errors).toEqual([]);
    });
});
