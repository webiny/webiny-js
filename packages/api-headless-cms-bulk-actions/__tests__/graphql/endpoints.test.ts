import { describe, expect, it } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
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

const runBulkAction = async (
    action: string,
    entries: { rwd: string; pw?: string },
    data?: Record<string, unknown>,
    plugins: any[] = []
) => {
    const { invoke } = useGraphQlHandler({
        plugins: [createMockModels(), ...plugins],
        permissions: cmsPermissions(entries)
    });
    const [body] = await invoke({
        type: "manage",
        body: {
            query: `mutation BulkAction($data: JSON) { bulkActionCar(action: ${action}, where: {}, data: $data) { data { id } error { code message } } }`,
            variables: { data }
        }
    } as any);
    return body;
};

const MOVE_TO_FOLDER_DATA = { folderId: "root" };

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
        const data = action === "MoveToFolder" ? MOVE_TO_FOLDER_DATA : undefined;
        const body = await runBulkAction(action, entries, data);

        // The task is started; it fails only because tests have no Step Function.
        expect(body.errors?.[0]?.message).toBe("Could not trigger the step function!");
    });
});

/**
 * Folder-level permissions where only the "allowed" folder can be written to.
 */
const createFolderLevelPermissions = () => {
    return createRegisterExtensionPlugin(context => {
        context.container.registerInstance(FolderLevelPermissions, {
            canUseFolderLevelPermissions: () => true,
            getFolderLevelPermissions: async (folderId: string) => [{ folderId }],
            canAccessFolderContent: async ({ permissions }: { permissions: any[] }) => {
                return permissions[0]?.folderId === "allowed";
            }
        } as unknown as FolderLevelPermissions.Interface);
    });
};

describe("Bulk move to folder", () => {
    it("should refuse a move without a target folder", async () => {
        const body = await runBulkAction("MoveToFolder", { rwd: "rw" });

        expect(body.data.bulkActionCar).toMatchObject({
            data: null,
            error: { code: "VALIDATION_FAILED" }
        });
    });

    it("should refuse a move into a folder the caller can't write to", async () => {
        const body = await runBulkAction("MoveToFolder", { rwd: "rw" }, { folderId: "denied" }, [
            createFolderLevelPermissions()
        ]);

        expect(body.data.bulkActionCar).toMatchObject({
            data: null,
            error: { code: "Cms/Entry/NotAuthorized" }
        });
    });

    it("should start a move into a folder the caller can write to", async () => {
        const body = await runBulkAction("MoveToFolder", { rwd: "rw" }, { folderId: "allowed" }, [
            createFolderLevelPermissions()
        ]);

        // The task is started; it fails only because tests have no Step Function.
        expect(body.errors?.[0]?.message).toBe("Could not trigger the step function!");
    });
});
