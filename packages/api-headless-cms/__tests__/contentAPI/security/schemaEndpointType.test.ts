import { describe, expect, it } from "vitest";
import type { ExecutionResult } from "graphql";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";

const DELETE_GROUP_MUTATION = /* GraphQL */ `
    mutation {
        deleteContentModelGroup(id: "non-existing-group") {
            error {
                code
            }
        }
    }
`;

describe("Executable schema endpoint type", () => {
    it("should not include manage parts in the read schema when requested from the manage endpoint", async () => {
        const handler = useGraphQLHandler({ path: "manage" });

        // Any request creates the context.
        await handler.listContentModelsQuery();
        const context = handler.getContext();
        expect(context.cms.type).toEqual("manage");
        expect(context.cms.MANAGE).toBe(true);

        const executeReadSchema = await context.cms.getExecutableSchema("read");

        // The original flags are restored after the schema is generated.
        expect(context.cms.type).toEqual("manage");
        expect(context.cms.MANAGE).toBe(true);
        expect(context.cms.READ).toBe(false);
        expect(context.cms.PREVIEW).toBe(false);

        const result = (await executeReadSchema({
            query: DELETE_GROUP_MUTATION
        })) as ExecutionResult;

        // The read schema must not contain manage-only mutations.
        expect(result.errors?.length).toBeGreaterThan(0);
        expect(result.data?.deleteContentModelGroup).toBeUndefined();
    });

    it("should still include manage parts in the manage schema", async () => {
        const handler = useGraphQLHandler({ path: "read" });

        await handler.listContentModelsQuery();
        const context = handler.getContext();
        expect(context.cms.type).toEqual("read");

        const executeManageSchema = await context.cms.getExecutableSchema("manage");

        expect(context.cms.type).toEqual("read");
        expect(context.cms.READ).toBe(true);
        expect(context.cms.MANAGE).toBe(false);

        const result = (await executeManageSchema({
            query: DELETE_GROUP_MUTATION
        })) as ExecutionResult;

        expect(result.errors).toBeUndefined();
        expect(result.data?.deleteContentModelGroup).toMatchObject({
            error: { code: expect.any(String) }
        });
    });
});
