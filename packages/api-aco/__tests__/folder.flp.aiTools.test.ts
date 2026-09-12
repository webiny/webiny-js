import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";

interface AccessResult {
    folderId: string;
    title: string;
    path: string;
    permissions: { target: string; level: string }[];
    replacedExistingLevel?: string;
    removed?: { target: string; level: string };
}

/**
 * Reads the FLP record, not the folder entry.
 *
 * The two are separate stores: a permission write lands on the folder entry, and a projection copies
 * it onto the FLP record, which is what folder reads actually report. Asserting the entry alone would
 * pass while every reader still saw the old permissions, so these tests assert the record.
 */
const readFlpPermissions = async (container: Container, folderId: string) => {
    const flp = await container.resolve(AcoFlpCrud).get(folderId);
    return flp?.permissions ?? [];
};

const getTool = (container: Container, name: string) => {
    const tool = container.resolveAll(AiSdkTool).find(candidate => candidate.name === name);

    if (!tool) {
        throw new Error(`Tool "${name}" is not registered.`);
    }

    return tool;
};

describe("Folder access AI tools", () => {
    const { handler } = useHandler();

    describe("grantFolderAccess", () => {
        it("should grant access and project it onto the FLP record", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const grant = getTool(context.container, "grantFolderAccess");

            const created = await createFolder.execute({
                title: "Grant 1",
                type: "type1",
                slug: "grant1",
                parentId: null
            });

            const folder = created.value;

            const result = (await grant.execute({
                folderId: folder.id,
                target: "admin:1234",
                level: "viewer"
            })) as AccessResult;

            expect(result.permissions).toEqual([{ target: "admin:1234", level: "viewer" }]);
            expect(result.replacedExistingLevel).toBeUndefined();

            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([
                { target: "admin:1234", level: "viewer" }
            ]);
        });

        it("should leave rules for other targets in place", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const grant = getTool(context.container, "grantFolderAccess");

            const created = await createFolder.execute({
                title: "Grant 2",
                type: "type1",
                slug: "grant2",
                parentId: null
            });

            const folder = created.value;

            await grant.execute({ folderId: folder.id, target: "admin:1", level: "viewer" });
            await grant.execute({ folderId: folder.id, target: "admin:2", level: "editor" });

            /*
             * The whole reason grant takes ONE target: an earlier tool accepted the complete set and
             * replaced it, so a target the model forgot to repeat lost its access without appearing
             * anywhere in the approval.
             */
            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual(
                expect.arrayContaining([
                    { target: "admin:1", level: "viewer" },
                    { target: "admin:2", level: "editor" }
                ])
            );
        });

        it("should change the level of an existing rule and report the level it replaced", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const grant = getTool(context.container, "grantFolderAccess");

            const created = await createFolder.execute({
                title: "Grant 3",
                type: "type1",
                slug: "grant3",
                parentId: null
            });

            const folder = created.value;

            await grant.execute({ folderId: folder.id, target: "admin:1234", level: "viewer" });

            const result = (await grant.execute({
                folderId: folder.id,
                target: "admin:1234",
                level: "owner"
            })) as AccessResult;

            expect(result.replacedExistingLevel).toBe("viewer");

            // One rule per target, at the new level, rather than two rules for the same target.
            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([
                { target: "admin:1234", level: "owner" }
            ]);
        });

        it("should refuse a team that does not exist", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const grant = getTool(context.container, "grantFolderAccess");

            const created = await createFolder.execute({
                title: "Grant 4",
                type: "type1",
                slug: "grant4",
                parentId: null
            });

            const folder = created.value;

            /*
             * A folder rule names a team by slug, and the field is only typed as a template string,
             * so an unknown value is stored happily and then matches nobody.
             */
            await expect(
                grant.execute({
                    folderId: folder.id,
                    target: "team:nope",
                    level: "viewer"
                })
            ).rejects.toThrow(/not a known team/);

            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([]);
        });
    });

    describe("revokeFolderAccess", () => {
        it("should revoke only the named target and project it onto the FLP record", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const grant = getTool(context.container, "grantFolderAccess");
            const revoke = getTool(context.container, "revokeFolderAccess");

            const created = await createFolder.execute({
                title: "Revoke 1",
                type: "type1",
                slug: "revoke1",
                parentId: null
            });

            const folder = created.value;

            await grant.execute({ folderId: folder.id, target: "admin:1", level: "viewer" });
            await grant.execute({ folderId: folder.id, target: "admin:2", level: "editor" });

            const result = (await revoke.execute({
                folderId: folder.id,
                target: "admin:1"
            })) as AccessResult;

            expect(result.removed).toEqual({ target: "admin:1", level: "viewer" });

            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([
                { target: "admin:2", level: "editor" }
            ]);
        });

        it("should revoke the last rule, leaving no direct permissions", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const grant = getTool(context.container, "grantFolderAccess");
            const revoke = getTool(context.container, "revokeFolderAccess");

            const created = await createFolder.execute({
                title: "Revoke 2",
                type: "type1",
                slug: "revoke2",
                parentId: null
            });

            const folder = created.value;

            await grant.execute({ folderId: folder.id, target: "admin:1234", level: "viewer" });
            await revoke.execute({ folderId: folder.id, target: "admin:1234" });

            /*
             * Emptying the set is the case most likely to be dropped on the way to storage, since an
             * empty array is easy to mistake for "nothing to update".
             */
            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([]);
        });

        it("should refuse a target that has no direct rule", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const revoke = getTool(context.container, "revokeFolderAccess");

            const created = await createFolder.execute({
                title: "Revoke 3",
                type: "type1",
                slug: "revoke3",
                parentId: null
            });

            const folder = created.value;

            // Reporting a removal that changed nothing would leave the user believing access was withdrawn.
            await expect(
                revoke.execute({ folderId: folder.id, target: "admin:1234" })
            ).rejects.toThrow(/nothing to revoke/);
        });

        it("should refuse a target the folder inherits", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);
            const revoke = getTool(context.container, "revokeFolderAccess");

            const parentResult = await createFolder.execute({
                title: "Revoke 4 parent",
                type: "type1",
                slug: "revoke4parent",
                parentId: null
            });

            const parent = parentResult.value;

            await updateFolder.execute(parent.id, {
                permissions: [{ target: "admin:1234", level: "viewer" }]
            });

            const childResult = await createFolder.execute({
                title: "Revoke 4 child",
                type: "type1",
                slug: "revoke4child",
                parentId: parent.id
            });

            const child = childResult.value;

            /*
             * Writing an inherited target back as a direct rule would detach the child from where the
             * grant came from, so the tool sends the user to the folder that defines it.
             */
            await expect(
                revoke.execute({ folderId: child.id, target: "admin:1234" })
            ).rejects.toThrow(/inherited/);
        });
    });
});
