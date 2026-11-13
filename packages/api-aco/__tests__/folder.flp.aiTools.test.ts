import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import { RECORD_CHANGED_WEBSOCKET_ACTION } from "@webiny/api-core/features/websockets/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { FlpFactory } from "~/features/flp/shared/abstractions.js";

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
 *
 * Stored object values carry a generated `_id`, which these tests don't assert on, so it's dropped.
 */
const readFlpPermissions = async (container: Container, folderId: string) => {
    const flp = await container.resolve(AcoFlpCrud).get(folderId);
    const permissions = flp?.permissions ?? [];
    return permissions.map(({ _id, ...permission }: { _id?: string }) => permission);
};

/**
 * The runnable half of a tool, built the way `AiSdkTools` builds it at call time. A registered tool
 * carries metadata only, so resolving one and calling `execute` on it would find nothing there.
 */
const getTool = (container: Container, name: string) => {
    const tool = container
        .resolveAll(AiSdkToolDefinition)
        .find(candidate => candidate.name === name);

    if (!tool) {
        throw new Error(`Tool "${name}" is not registered.`);
    }

    return container.resolveImplementation(tool.handler);
};

describe("Folder access AI tools", () => {
    const { handler, websocketMessages } = useHandler();

    const createRootFolder = async (container: Container, slug: string) => {
        const created = await container.resolve(CreateFolderUseCase).execute({
            title: slug,
            type: "type1",
            slug,
            parentId: null
        });

        return created.value;
    };

    /*
     * Code-defined rules are merged into the folder on read with `plugin: true`, and an update that
     * sends one back is refused. A tool that writes the folder's permissions back must leave them out.
     */
    const createFolderWithCodeRule = async (container: Container, slug: string) => {
        container.registerInstance(FlpFactory, {
            async execute() {
                return [
                    {
                        type: "type1",
                        path: `/${slug}`,
                        permissions: [{ user: "5678", level: "viewer" as const }]
                    }
                ];
            }
        });

        const folder = await createRootFolder(container, slug);

        const found = await container.resolve(GetFolderUseCase).execute(folder.id);
        expect(found.value.permissions).toContainEqual(
            expect.objectContaining({ target: "admin:5678", plugin: true })
        );

        return folder;
    };

    /*
     * The admin caches folders, and a change made by a tool never passes through that cache, so each
     * write tells the user's open tabs which folder to read back.
     */
    describe("admin notifications", () => {
        it("should tell the user's tabs which folder the tool created", async () => {
            const context = await handler();
            websocketMessages.length = 0;

            const created = (await getTool(context.container, "createFolder").execute({
                title: "Notify create",
                slug: "notify-create",
                type: "type1"
            })) as { id: string };

            expect(websocketMessages).toEqual([
                expect.objectContaining({
                    action: RECORD_CHANGED_WEBSOCKET_ACTION,
                    data: { type: "aco.folder", id: created.id, change: "created" }
                })
            ]);
        });

        it("should tell the user's tabs which folder a grant changed", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "notify-grant");
            websocketMessages.length = 0;

            await getTool(context.container, "grantFolderAccess").execute({
                folderId: folder.id,
                target: "admin:1234",
                level: "viewer"
            });

            expect(websocketMessages).toEqual([
                expect.objectContaining({
                    action: RECORD_CHANGED_WEBSOCKET_ACTION,
                    data: { type: "aco.folder", id: folder.id, change: "updated" }
                })
            ]);
        });

        it("should tell the user's tabs which folder a revoke changed", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "notify-revoke");
            const grant = getTool(context.container, "grantFolderAccess");
            await grant.execute({ folderId: folder.id, target: "admin:1234", level: "viewer" });
            websocketMessages.length = 0;

            await getTool(context.container, "revokeFolderAccess").execute({
                folderId: folder.id,
                target: "admin:1234"
            });

            expect(websocketMessages).toEqual([
                expect.objectContaining({
                    action: RECORD_CHANGED_WEBSOCKET_ACTION,
                    data: { type: "aco.folder", id: folder.id, change: "updated" }
                })
            ]);
        });

        it("should send nothing when the change is refused", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "notify-refused");
            websocketMessages.length = 0;

            await expect(
                getTool(context.container, "revokeFolderAccess").execute({
                    folderId: folder.id,
                    target: "admin:1234"
                })
            ).rejects.toThrow(/nothing to revoke/);

            expect(websocketMessages).toEqual([]);
        });
    });

    describe("deleteFolder", () => {
        it("should delete an empty folder and tell the user's tabs", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "delete-1");
            websocketMessages.length = 0;

            await expect(
                getTool(context.container, "deleteFolder").execute({
                    folderId: folder.id,
                    title: folder.title
                })
            ).resolves.toMatchObject({ id: folder.id, title: folder.title });

            const found = await context.container.resolve(GetFolderUseCase).execute(folder.id);
            expect(found.isFail()).toBe(true);
            expect(websocketMessages).toEqual([
                expect.objectContaining({
                    action: RECORD_CHANGED_WEBSOCKET_ACTION,
                    data: { type: "aco.folder", id: folder.id, change: "deleted" }
                })
            ]);
        });

        it("should refuse when the title does not match the folder", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "delete-2");
            websocketMessages.length = 0;

            // The title is what the user approves by, so a mismatch means they approved another folder.
            await expect(
                getTool(context.container, "deleteFolder").execute({
                    folderId: folder.id,
                    title: "Something else"
                })
            ).rejects.toThrow(/nothing was deleted/);

            const found = await context.container.resolve(GetFolderUseCase).execute(folder.id);
            expect(found.isOk()).toBe(true);
            expect(websocketMessages).toEqual([]);
        });

        it("should refuse a folder that still has subfolders", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "delete-3");
            await context.container.resolve(CreateFolderUseCase).execute({
                title: "delete-3-child",
                type: "type1",
                slug: "delete-3-child",
                parentId: folder.id
            });
            websocketMessages.length = 0;

            await expect(
                getTool(context.container, "deleteFolder").execute({
                    folderId: folder.id,
                    title: folder.title
                })
            ).rejects.toThrow(/Could not delete the folder/);

            expect(websocketMessages).toEqual([]);
        });
    });

    describe("updateFolder", () => {
        const createChildFolder = async (container: Container, slug: string, parentId: string) => {
            const created = await container.resolve(CreateFolderUseCase).execute({
                title: slug,
                type: "type1",
                slug,
                parentId
            });

            return created.value;
        };

        it("should rename a folder, keep its slug and access rules, and tell the user's tabs", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "update-rename");
            await getTool(context.container, "grantFolderAccess").execute({
                folderId: folder.id,
                target: "admin:1234",
                level: "viewer"
            });
            websocketMessages.length = 0;

            await expect(
                getTool(context.container, "updateFolder").execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    title: "Renamed"
                })
            ).resolves.toMatchObject({
                id: folder.id,
                title: "Renamed",
                slug: folder.slug,
                path: folder.path
            });

            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([
                { target: "admin:1234", level: "viewer" }
            ]);
            expect(websocketMessages).toEqual([
                expect.objectContaining({
                    action: RECORD_CHANGED_WEBSOCKET_ACTION,
                    data: { type: "aco.folder", id: folder.id, change: "updated" }
                })
            ]);
        });

        it("should rename a folder that has a code-defined access rule", async () => {
            const context = await handler();
            const folder = await createFolderWithCodeRule(context.container, "update-code-rule");

            await expect(
                getTool(context.container, "updateFolder").execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    title: "Renamed"
                })
            ).resolves.toMatchObject({ title: "Renamed" });
        });

        it("should move a folder under another folder and back to the root", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "update-move");
            const target = await createRootFolder(context.container, "update-move-target");
            const update = getTool(context.container, "updateFolder");

            await expect(
                update.execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    parentId: target.id
                })
            ).resolves.toMatchObject({
                parentId: target.id,
                path: `${target.path}/${folder.slug}`
            });

            await expect(
                update.execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    parentId: null
                })
            ).resolves.toMatchObject({ parentId: null, path: folder.path });
        });

        it("should refuse when the current title does not match the folder", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "update-mismatch");
            websocketMessages.length = 0;

            await expect(
                getTool(context.container, "updateFolder").execute({
                    folderId: folder.id,
                    currentTitle: "Something else",
                    title: "Renamed"
                })
            ).rejects.toThrow(/nothing was updated/);

            const found = await context.container.resolve(GetFolderUseCase).execute(folder.id);
            expect(found.value.title).toBe(folder.title);
            expect(websocketMessages).toEqual([]);
        });

        it("should refuse an update that changes nothing", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "update-nothing");

            await expect(
                getTool(context.container, "updateFolder").execute({
                    folderId: folder.id,
                    currentTitle: folder.title
                })
            ).rejects.toThrow(/Nothing to update/);
        });

        /*
         * The folder feature itself accepts both moves below. Either would leave the subtree with no
         * path back to the root.
         */
        it("should refuse to move a folder into itself or its own subfolder", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "update-cycle");
            const child = await createChildFolder(
                context.container,
                "update-cycle-child",
                folder.id
            );
            const grandchild = await createChildFolder(
                context.container,
                "update-cycle-grandchild",
                child.id
            );
            const update = getTool(context.container, "updateFolder");
            websocketMessages.length = 0;

            await expect(
                update.execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    parentId: folder.id
                })
            ).rejects.toThrow(/cannot be moved into itself/);

            await expect(
                update.execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    parentId: grandchild.id
                })
            ).rejects.toThrow(/inside the folder being moved/);

            const found = await context.container.resolve(GetFolderUseCase).execute(folder.id);
            expect(found.value.parentId ?? null).toBe(null);
            expect(websocketMessages).toEqual([]);
        });

        it("should refuse to move a folder under a folder of another type", async () => {
            const context = await handler();
            const folder = await createRootFolder(context.container, "update-type");
            const other = await context.container.resolve(CreateFolderUseCase).execute({
                title: "update-type-other",
                type: "type2",
                slug: "update-type-other",
                parentId: null
            });

            await expect(
                getTool(context.container, "updateFolder").execute({
                    folderId: folder.id,
                    currentTitle: folder.title,
                    parentId: other.value.id
                })
            ).rejects.toThrow(/can only move within its own type/);
        });
    });

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

        it("should grant access on a folder that has a code-defined access rule", async () => {
            const context = await handler();
            const folder = await createFolderWithCodeRule(context.container, "grant-code-rule");

            await getTool(context.container, "grantFolderAccess").execute({
                folderId: folder.id,
                target: "admin:1234",
                level: "viewer"
            });

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

        it("should revoke access on a folder that has a code-defined access rule", async () => {
            const context = await handler();
            const folder = await createFolderWithCodeRule(context.container, "revoke-code-rule");
            const grant = getTool(context.container, "grantFolderAccess");
            await grant.execute({ folderId: folder.id, target: "admin:1234", level: "viewer" });

            await getTool(context.container, "revokeFolderAccess").execute({
                folderId: folder.id,
                target: "admin:1234"
            });

            await expect(readFlpPermissions(context.container, folder.id)).resolves.toEqual([]);
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
