import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import type { CmsEndpointType, UseGQLHandlerParams } from "~tests/context/useGraphQLHandler";
import { useGraphQlHandler } from "~tests/context/useGraphQLHandler";
import { createMockModels } from "~tests/mocks";

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

interface EntryPermission {
    rwd: string;
    pw?: string;
}

interface CanAccessFolderContentArgs {
    permissions: FolderPermissionMock[];
}

interface FolderPermissionMock {
    folderId: string;
}

type ContainerPlugin = (container: Container) => void;

const NOT_AUTHORIZED = "Cms/Entry/NotAuthorized";

describe("Bulk action endpoints", () => {
    it.each<CmsEndpointType>(["read", "preview"])(
        "should not expose bulk action mutations on the %s API",
        async endpointType => {
            const { invokeCms } = useGraphQlHandler({
                plugins: [createMockModels()],
                endpointType
            });

            const [body] = await invokeCms({ body: { query: BULK_ACTION_MUTATION } });

            expect(body.data).toBeFalsy();
            expect(body.errors[0].message).toMatch(/bulkActionCar/);
        }
    );

    it("should expose bulk action mutations on the manage API", async () => {
        const { invokeCms } = useGraphQlHandler({
            plugins: [createMockModels()],
            endpointType: "manage"
        });

        const [body] = await invokeCms({ body: { query: BULK_ACTION_MUTATION } });

        // The resolver runs: the mutation is part of the schema.
        expect(JSON.stringify(body.errors ?? [])).not.toMatch(/Cannot query field/);
    });
});

const cmsPermissions = (entries: EntryPermission): SecurityPermission[] => {
    // CMS permissions are joined by `_src`, so they must share one.
    return [
        { _src: "role", name: "cms.endpoint.manage" },
        { _src: "role", name: "cms.contentModelGroup", rwd: "r" },
        { _src: "role", name: "cms.contentModel", rwd: "r" },
        { _src: "role", name: "cms.contentEntry", ...entries }
    ];
};

const runBulkAction = async (
    action: string,
    entries: EntryPermission,
    data?: Record<string, unknown>,
    plugins: ContainerPlugin[] = []
) => {
    const { invokeCms } = useGraphQlHandler({
        // Container plugins run after the bulk actions feature, so they can override its services.
        plugins: [createMockModels(), ...plugins] as unknown as UseGQLHandlerParams["plugins"],
        permissions: cmsPermissions(entries)
    });
    const [body] = await invokeCms({
        body: {
            query: `mutation BulkAction($data: JSON) { bulkActionCar(action: ${action}, where: {}, data: $data) { data { id } error { code message } } }`,
            variables: { data }
        }
    });
    return body;
};

const expectNotRefused = (body: any) => {
    const code = body.data?.bulkActionCar?.error?.code;
    expect(code).not.toBe(NOT_AUTHORIZED);
    expect(code).not.toBe("VALIDATION_FAILED");
};

const MOVE_TO_FOLDER_DATA = { folderId: "root" };

describe("Bulk action permissions", () => {
    it.each<[string, EntryPermission]>([
        ["Delete", { rwd: "rw" }],
        ["MoveToTrash", { rwd: "rw" }],
        ["MoveToFolder", { rwd: "r" }],
        ["Publish", { rwd: "rwd", pw: "u" }],
        ["Unpublish", { rwd: "rwd", pw: "p" }]
    ])("should refuse %s without the required permission", async (action, entries) => {
        const data = action === "MoveToFolder" ? MOVE_TO_FOLDER_DATA : undefined;
        const body = await runBulkAction(action, entries, data);

        expect(body.data.bulkActionCar).toMatchObject({
            data: null,
            error: { code: NOT_AUTHORIZED }
        });
    });

    it.each<[string, EntryPermission]>([
        ["Delete", { rwd: "rwd" }],
        ["MoveToTrash", { rwd: "rwd" }],
        ["MoveToFolder", { rwd: "rw" }],
        ["Publish", { rwd: "r", pw: "p" }],
        ["Unpublish", { rwd: "r", pw: "u" }]
    ])("should start %s with the required permission", async (action, entries) => {
        const data = action === "MoveToFolder" ? MOVE_TO_FOLDER_DATA : undefined;
        const body = await runBulkAction(action, entries, data);

        expectNotRefused(body);
    });
});

/**
 * Folder-level permissions where only the "allowed" folder can be written to.
 */
const createFolderLevelPermissions = (): ContainerPlugin => {
    return container => {
        container.registerInstance(FolderLevelPermissions, {
            canUseFolderLevelPermissions: () => true,
            getFolderLevelPermissions: async (folderId: string) => [{ folderId }],
            canAccessFolderContent: async ({ permissions }: CanAccessFolderContentArgs) => {
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
            error: { code: NOT_AUTHORIZED }
        });
    });

    it("should start a move into a folder the caller can write to", async () => {
        const body = await runBulkAction("MoveToFolder", { rwd: "rw" }, { folderId: "allowed" }, [
            createFolderLevelPermissions()
        ]);

        expectNotRefused(body);
    });
});
