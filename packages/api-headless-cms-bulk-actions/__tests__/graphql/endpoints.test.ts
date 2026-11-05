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

const cmsPermissions = (entries: { rwd: string; pw?: string }) => {
    // CMS permissions are joined by `_src`, so they must share one.
    return [
        { _src: "role", name: "cms.endpoint.manage" },
        { _src: "role", name: "cms.contentModelGroup", rwd: "r" },
        { _src: "role", name: "cms.contentModel", rwd: "r" },
        { _src: "role", name: "cms.contentEntry", ...entries }
    ] as any[];
};

const runBulkAction = async (action: string, entries: { rwd: string; pw?: string }) => {
    const { invoke } = useGraphQlHandler({
        plugins: [createMockModels()],
        permissions: cmsPermissions(entries)
    });
    const [body] = await invoke({
        type: "manage",
        body: {
            query: `mutation { bulkActionCar(action: ${action}, where: {}) { data { id } error { code message } } }`
        }
    } as any);
    return body;
};

describe("Bulk action permissions", () => {
    it.each([
        ["Delete", { rwd: "rw" }],
        ["MoveToTrash", { rwd: "rw" }],
        ["MoveToFolder", { rwd: "r" }],
        ["Publish", { rwd: "rwd", pw: "u" }],
        ["Unpublish", { rwd: "rwd", pw: "p" }]
    ])("should refuse %s without the required permission", async (action, entries) => {
        const body = await runBulkAction(action, entries);

        expect(body.data.bulkActionCar).toMatchObject({
            data: null,
            error: { code: "Cms/Entry/NotAuthorized" }
        });
    });

    it.each([
        ["Delete", { rwd: "rwd" }],
        ["MoveToTrash", { rwd: "rwd" }],
        ["MoveToFolder", { rwd: "rw" }],
        ["Publish", { rwd: "r", pw: "p" }],
        ["Unpublish", { rwd: "r", pw: "u" }]
    ])("should start %s with the required permission", async (action, entries) => {
        const body = await runBulkAction(action, entries);

        // The task is started; it fails only because tests have no Step Function.
        expect(body.errors?.[0]?.message).toBe("Could not trigger the step function!");
    });
});
