import { describe, expect, it } from "vitest";
import type { ExecutionResult } from "graphql";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";
import { HeadlessCmsEndpointConfig } from "~/HeadlessCmsEndpointConfig.js";

const DELETE_GROUP_MUTATION = /* GraphQL */ `
    mutation {
        deleteContentModelGroup(id: "non-existing-group") {
            error {
                code
            }
        }
    }
`;

describe("CMS schema executor endpoint type", () => {
    it("should not include manage parts in the read schema when requested from the manage endpoint", async () => {
        const handler = useGraphQLHandler({ path: "manage" });

        // Any request creates the context.
        await handler.listContentModelsQuery();
        const { container } = handler.getContext();
        expect(container.resolve(HeadlessCmsEndpointConfig).type).toEqual("manage");

        const result = (await container
            .resolve(CmsSchemaExecutor)
            .execute("read", { query: DELETE_GROUP_MUTATION })) as ExecutionResult;

        // The endpoint type of the request is restored after the schema is executed.
        expect(container.resolve(HeadlessCmsEndpointConfig).type).toEqual("manage");

        // The read schema must not contain manage-only mutations.
        expect(result.errors?.length).toBeGreaterThan(0);
        expect(result.data?.deleteContentModelGroup).toBeUndefined();
    });

    it("should still include manage parts in the manage schema", async () => {
        const handler = useGraphQLHandler({ path: "read" });

        await handler.listContentModelsQuery();
        const { container } = handler.getContext();
        expect(container.resolve(HeadlessCmsEndpointConfig).type).toEqual("read");

        const result = (await container
            .resolve(CmsSchemaExecutor)
            .execute("manage", { query: DELETE_GROUP_MUTATION })) as ExecutionResult;

        expect(container.resolve(HeadlessCmsEndpointConfig).type).toEqual("read");

        expect(result.errors).toBeUndefined();
        expect(result.data?.deleteContentModelGroup).toMatchObject({
            error: { code: expect.any(String) }
        });
    });
});
