import { describe, expect, it } from "vitest";
import { useGraphQlHandler } from "../context/useGraphQLHandler";
import { createMockModels } from "../mocks";

const BULK_ACTION_MUTATION = /* GraphQL */ `
    mutation {
        bulkActionCar(action: MoveToTrash, where: {}) {
            data {
                id
            }
            error {
                code
                message
            }
        }
    }
`;

describe("Bulk action endpoints", () => {
    it.each(["read", "preview"])(
        "should not expose bulk action mutations on the %s API",
        async type => {
            const { invoke } = useGraphQlHandler({ plugins: [createMockModels()] });

            const [body] = await invoke({ type, body: { query: BULK_ACTION_MUTATION } } as any);

            expect(body.data).toBeUndefined();
            expect(body.errors[0].message).toMatch(/bulkActionCar/);
        }
    );

    it("should expose bulk action mutations on the manage API", async () => {
        const { invoke } = useGraphQlHandler({ plugins: [createMockModels()] });

        const [body] = await invoke({
            type: "manage",
            body: { query: BULK_ACTION_MUTATION }
        } as any);

        // The resolver runs; starting the task fails only because tests have no Step Function.
        expect(body.errors?.[0]?.path).toEqual(["bulkActionCar"]);
    });
});
