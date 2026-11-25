import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { TriggerTaskUseCase } from "@webiny/background-tasks/api";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { useGraphQlHandler } from "../context/useGraphQLHandler";
import { createMockModels } from "../mocks";
import { identity } from "../context/helpers";

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

/**
 * Replaces the task trigger, so the tests can see the input the task would run with.
 */
const createTriggerCapture = () => {
    const inputs: Record<string, any>[] = [];
    const plugin = (container: any) => {
        container.registerInstance(TriggerTaskUseCase, {
            execute: async (params: { input: Record<string, any> }) => {
                inputs.push(params.input);
                return Result.ok({ id: "task-id" });
            }
        } as unknown as TriggerTaskUseCase.Interface);
    };
    return { inputs, plugin };
};

describe("Bulk action endpoints", () => {
    it.each(["read", "preview"] as const)(
        "should not expose bulk action mutations on the %s API",
        async type => {
            const { invokeCms } = useGraphQlHandler({
                plugins: [createMockModels()],
                cmsType: type
            });

            const [body] = await invokeCms({ type, body: { query: BULK_ACTION_MUTATION } });

            expect(body.data).toBeUndefined();
            expect(body.errors[0].message).toMatch(/bulkActionCar/);
        }
    );

    it("should expose bulk action mutations on the manage API", async () => {
        const { plugin } = createTriggerCapture();
        const { invokeCms } = useGraphQlHandler({ plugins: [createMockModels(), plugin] });

        const [body] = await invokeCms({
            type: "manage",
            body: { query: BULK_ACTION_MUTATION }
        });

        expect(body.data.bulkActionCar).toEqual({ data: { id: "task-id" }, error: null });
    });
});

const cmsPermissions = (entries: { rwd: string; pw?: string; own?: boolean }) => {
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
    const { plugin } = createTriggerCapture();
    const { invokeCms } = useGraphQlHandler({
        plugins: [createMockModels(), ...plugins, plugin],
        permissions: cmsPermissions(entries)
    });
    const [body] = await invokeCms({
        type: "manage",
        body: {
            query: `mutation BulkAction($data: JSON) { bulkActionCar(action: ${action}, where: {}, data: $data) { data { id } error { code message } } }`,
            variables: { data }
        }
    });
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

        expect(body.data.bulkActionCar).toEqual({ data: { id: "task-id" }, error: null });
    });
});

/**
 * Folder-level permissions where only the "allowed" folder can be written to.
 */
const createFolderLevelPermissions = () => {
    return (container: any) => {
        container.registerInstance(FolderLevelPermissions, {
            canUseFolderLevelPermissions: () => true,
            getFolderLevelPermissions: async (folderId: string) => [{ folderId }],
            listFolderLevelPermissions: async () => [
                { id: "allowed", permissions: [{ folderId: "allowed" }] },
                { id: "denied", permissions: [{ folderId: "denied" }] }
            ],
            canAccessFolderContent: async ({ permissions }: { permissions: any[] }) => {
                return permissions[0]?.folderId === "allowed";
            }
        } as unknown as FolderLevelPermissions.Interface);
    };
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

        expect(body.data.bulkActionCar).toEqual({ data: { id: "task-id" }, error: null });
    });
});

const runCapturedBulkAction = async (params: {
    action: string;
    permissions: any[];
    where: Record<string, unknown>;
    plugins?: any[];
}) => {
    const { inputs, plugin } = createTriggerCapture();
    const { invokeCms } = useGraphQlHandler({
        plugins: [createMockModels(), ...(params.plugins ?? []), plugin],
        permissions: params.permissions
    });
    const [body] = await invokeCms({
        type: "manage",
        body: {
            query: `mutation BulkAction($where: CarListWhereInput) { bulkActionCar(action: ${params.action}, where: $where) { data { id } error { code message } } }`,
            variables: { where: params.where }
        }
    });
    expect(body.data.bulkActionCar).toEqual({ data: { id: "task-id" }, error: null });
    expect(inputs).toHaveLength(1);
    return inputs[0];
};

describe("Bulk action entry scope", () => {
    it("should limit an own-only caller to own entries", async () => {
        const input = await runCapturedBulkAction({
            action: "MoveToTrash",
            permissions: cmsPermissions({ rwd: "rwd", own: true }),
            // The client must not be able to widen the scope.
            where: { createdBy: "someone-else" }
        });

        expect(input.where).toEqual({ createdBy: identity.id });
    });

    it("should limit a caller who can read all entries but delete only own entries", async () => {
        const readAll = cmsPermissions({ rwd: "r" }).map(p => ({ ...p, _src: "readAll" }));
        const deleteOwn = cmsPermissions({ rwd: "rwd", own: true }).map(p => ({
            ...p,
            _src: "deleteOwn"
        }));

        const input = await runCapturedBulkAction({
            action: "Delete",
            permissions: [...readAll, ...deleteOwn],
            where: {}
        });

        expect(input.where).toEqual({ createdBy: identity.id });
    });

    it("should not limit a caller who can change all entries", async () => {
        const input = await runCapturedBulkAction({
            action: "MoveToTrash",
            permissions: cmsPermissions({ rwd: "rwd" }),
            where: { createdBy: "someone-else" }
        });

        expect(input.where).toEqual({ createdBy: "someone-else" });
    });

    it("should leave out entries in folders the caller can't change", async () => {
        const input = await runCapturedBulkAction({
            action: "MoveToTrash",
            permissions: cmsPermissions({ rwd: "rwd" }),
            where: { wbyAco_location: { folderId_in: ["allowed", "denied"] } },
            plugins: [createFolderLevelPermissions()]
        });

        expect(input.where).toEqual({
            wbyAco_location: {
                folderId_in: ["allowed", "denied"],
                folderId_not_in: ["denied"]
            }
        });
    });
});
