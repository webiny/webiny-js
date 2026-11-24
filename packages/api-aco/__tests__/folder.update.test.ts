import { describe, it, expect } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const FOLDER_TYPE = "test-folders";

const identityA: IdentityData = { id: "1", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "2", type: "admin", displayName: "B" };

describe("Folder update", () => {
    const { aco: acoIdentityA } = useGraphQlHandler({ identity: identityA });
    const { aco: acoIdentityB } = useGraphQlHandler({ identity: identityB, permissions: [] });

    const createFolder = async (data: Record<string, unknown>) => {
        const [response] = await acoIdentityA.createFolder({
            data: { type: FOLDER_TYPE, ...data }
        });
        return response.data.aco.createFolder.data;
    };

    const updateFolder = async (
        aco: typeof acoIdentityA,
        id: string,
        data: Record<string, unknown>
    ) => {
        const [response] = await aco.updateFolder({ id, data });
        return response.data.aco.updateFolder;
    };

    /*
     * An update without `permissions` keeps the stored rules. The access check and the returned
     * folder have to use those rules too, not judge the folder as if it had none.
     */
    it("should report the stored rules after an update that leaves permissions out", async () => {
        const folder = await createFolder({ title: "Folder A", slug: "folder-a" });
        await updateFolder(acoIdentityA, folder.id, {
            permissions: [{ level: "owner", target: `admin:${identityB.id}` }]
        });

        const renamed = await updateFolder(acoIdentityB, folder.id, { title: "Renamed" });

        expect(renamed.error).toBeNull();
        expect(renamed.data).toMatchObject({
            title: "Renamed",
            canManagePermissions: true,
            hasNonInheritedPermissions: true,
            permissions: [{ target: "admin:2", level: "owner", inheritedFrom: null }]
        });
    });

    /*
     * These checks live in the use case, so they apply to every caller: GraphQL, the assistant's
     * updateFolder tool, and code that resolves `UpdateFolderUseCase`.
     */
    it("should refuse to move a folder into itself or its own subfolder", async () => {
        const folder = await createFolder({ title: "Parent", slug: "parent" });
        const child = await createFolder({ title: "Child", slug: "child", parentId: folder.id });

        await expect(
            updateFolder(acoIdentityA, folder.id, { parentId: folder.id })
        ).resolves.toMatchObject({
            data: null,
            error: {
                code: "Aco/Folder/ValidationError",
                message: "A folder cannot be moved into itself."
            }
        });

        await expect(
            updateFolder(acoIdentityA, folder.id, { parentId: child.id })
        ).resolves.toMatchObject({
            data: null,
            error: {
                code: "Aco/Folder/ValidationError",
                message:
                    'Folder "Child" is inside the folder being moved, so it cannot be its new parent.'
            }
        });
    });
});
