import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ListModelsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import type { CmsModelStorageOperationsListParams } from "@webiny/api-headless-cms/types/index.js";
import { createAwsDdbApiHandler } from "~/createWebinyApiHandler.js";

/**
 * Extensions register in the request container, and a decorator only applies to registrations in its
 * own container or below it. The CMS storage operations used to live in the root, where extension
 * decorators were silently skipped. They are per request now, so an extension can decorate them.
 */
class ListModelsProbe implements ListModelsStorageOperation.Interface {
    constructor(private readonly decoratee: ListModelsStorageOperation.Interface) {}

    async execute(params: CmsModelStorageOperationsListParams) {
        return this.decoratee.execute(params);
    }
}

const ListModelsProbeDecorator = ListModelsStorageOperation.createDecorator({
    decorator: ListModelsProbe,
    dependencies: []
});

describe("api-event-handler-aws-ddb — CMS storage decorators", () => {
    it("applies an extension's decorator to a CMS storage operation", async () => {
        const resolved: ListModelsStorageOperation.Interface[] = [];

        const extension = createRegisterExtensionPlugin(({ container }) => {
            container.registerDecorator(ListModelsProbeDecorator);
            const listModels = container.resolve(ListModelsStorageOperation);
            resolved.push(listModels);
        });

        const handler = createAwsDdbApiHandler({
            extensions: () => [extension],
            documentClient: getDocumentClient()
        });

        const body = JSON.stringify({ query: "{ __typename }" });
        await handler({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                "content-type": "application/json",
                "x-tenant": "root"
            },
            requestContext: { requestId: "test-req-cms-decorators" },
            body,
            isBase64Encoded: false
        });

        expect(resolved).toHaveLength(1);

        const [listModels] = resolved;

        expect(listModels).toBeInstanceOf(ListModelsProbe);
    });
});
