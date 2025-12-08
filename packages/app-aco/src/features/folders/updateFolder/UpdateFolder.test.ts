import { describe, it, expect, beforeEach, vi } from "vitest";
import { type FolderPermission } from "@webiny/shared-aco/flp/flp.types.js";
import { LoadingRepository } from "@webiny/app-utils";
import { ROOT_FOLDER } from "~/constants.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { ListCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import { Container } from "@webiny/di";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { UpdateFolderFeature } from "~/features/folders/updateFolder/feature.js";
import { UpdateFolderUseCase } from "~/features/folders/updateFolder/abstractions.js";
import { UpdateFolderGateway } from "~/features/folders/updateFolder/abstractions.js";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";

class UpdateFolderMockGateway implements UpdateFolderGateway.Interface {
    mockResponse: Partial<FolderDto>;

    constructor(mockResponse: Partial<FolderDto>) {
        this.mockResponse = mockResponse;
    }

    async execute() {
        return this.mockResponse as FolderDto;
    }
}

interface SetupTestParams {
    gateway: UpdateFolderGateway.Interface;
    folders?: Folder[];
    foldersCache?: ListCache<Folder>;
}

describe("UpdateFolder", () => {
    const type = "abc";

    function setupTest(params: SetupTestParams) {
        const container = new Container();
        const foldersCache = params.foldersCache ? params.foldersCache : new ListCache<Folder>();

        if (!params.foldersCache) {
            foldersCache.addItems([
                Folder.create({
                    id: "any-folder-id",
                    title: "Any Folder",
                    slug: "any-folder",
                    parentId: null,
                    permissions: [],
                    type
                })
            ]);
        }

        if (params.folders) {
            foldersCache.addItems(params.folders);
        }

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);
        container.registerInstance(FoldersLoadingRepository, new LoadingRepository());

        UpdateFolderFeature.register(container);
        container.registerInstance(UpdateFolderGateway, params.gateway);

        return { container, foldersCache, updateFolder: container.resolve(UpdateFolderUseCase) };
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should be able to update a folder", async () => {
        const gateway = new UpdateFolderMockGateway({
            id: "any-folder-id",
            title: "Updated Folder",
            slug: "updated-folder",
            parentId: "another-id",
            permissions: [],
            type
        });

        const { updateFolder, foldersCache } = setupTest({ gateway });

        const spy = vi.spyOn(gateway, "execute");

        expect(foldersCache.hasItems()).toBe(true);
        const item = foldersCache.getItem(folder => folder.id === "any-folder-id");
        expect(item?.id).toEqual("any-folder-id");
        expect(item?.title).toEqual("Any Folder");

        await updateFolder.execute({
            id: "any-folder-id",
            title: "Updated Folder",
            slug: "updated-folder",
            parentId: "another-id",
            permissions: [],
            type
        });

        expect(spy).toHaveBeenCalledTimes(1);
        const updatedItem = foldersCache.getItem(folder => folder.id === "any-folder-id");

        expect(updatedItem).toBeDefined();
        expect(updatedItem?.id).toEqual("any-folder-id");
        expect(updatedItem?.type).toEqual(type);
        expect(updatedItem?.title).toEqual("Updated Folder");
        expect(updatedItem?.slug).toEqual("updated-folder");
        expect(updatedItem?.parentId).toEqual("another-id");
    });

    it("should propagate `permissions` changes to child folders", async () => {
        const parentFolder = Folder.create({
            id: "parent-folder-id",
            title: "Parent Folder",
            slug: "parent-folder",
            parentId: null,
            permissions: [],
            type
        });

        const childFolder1 = Folder.create({
            id: "child-folder-id-1",
            title: "Child Folder 1",
            slug: "child-folder-1",
            parentId: parentFolder.id,
            permissions: [],
            type
        });

        const childFolder2 = Folder.create({
            id: "child-folder-id-2",
            title: "Child Folder 2",
            slug: "child-folder-2",
            parentId: childFolder1.id,
            permissions: [],
            type
        });

        const childFolder3 = Folder.create({
            id: "child-folder-id-3",
            title: "Child Folder 3",
            slug: "child-folder-3",
            parentId: parentFolder.id, // <-- This folder is a sibling of childFolder1, not a child
            permissions: [],
            type
        });

        const foldersCache = new ListCache<Folder>();
        foldersCache.addItems([parentFolder, childFolder1, childFolder2, childFolder3]);

        // Let's update parentFolder, the change should be propagated to all it's children (childFolder1, childFolder2 and childFolder3).
        const parentNewPermissions: FolderPermission[] = [
            { level: "viewer", target: "admin:123" },
            { level: "viewer", target: "admin:456" }
        ];

        {
            const gateway = new UpdateFolderMockGateway({
                id: parentFolder.id,
                title: parentFolder.title,
                slug: parentFolder.slug,
                parentId: parentFolder.parentId,
                permissions: parentNewPermissions,
                type
            });

            const { updateFolder } = setupTest({ gateway, foldersCache });

            await updateFolder.execute({
                id: parentFolder.id,
                title: parentFolder.title,
                slug: parentFolder.slug,
                parentId: parentFolder.parentId,
                permissions: parentNewPermissions,
                type
            });

            const childFolderCache1 = foldersCache.getItem(folder => folder.id === childFolder1.id);
            expect(childFolderCache1?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${parentFolder?.id}`
                }))
            );

            const childFolderCache2 = foldersCache.getItem(folder => folder.id === childFolder2.id);
            expect(childFolderCache2?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${childFolderCache1?.id}`
                }))
            );

            const childFolderCache3 = foldersCache.getItem(folder => folder.id === childFolder3.id);
            expect(childFolderCache3?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${parentFolder?.id}`
                }))
            );
        }

        // Let's update childFolder1, the change should be propagated to childFolder2, but not to childFolder3
        const child1NewPermissions: FolderPermission[] = [{ level: "owner", target: "admin:123" }];

        {
            const gateway = new UpdateFolderMockGateway({
                id: childFolder1.id,
                title: childFolder1.title,
                slug: childFolder1.slug,
                parentId: childFolder1.parentId,
                permissions: child1NewPermissions,
                type
            });

            const { updateFolder } = setupTest({ gateway, foldersCache });

            await updateFolder.execute({
                id: childFolder1.id,
                title: childFolder1.title,
                slug: childFolder1.slug,
                parentId: childFolder1.parentId,
                permissions: child1NewPermissions,
                type
            });

            const childFolderCache1 = foldersCache.getItem(folder => folder.id === childFolder1.id);
            expect(childFolderCache1?.permissions).toEqual([
                ...child1NewPermissions,
                {
                    ...parentNewPermissions[1],
                    inheritedFrom: `parent:${parentFolder?.id}`
                }
            ]);

            const childFolderCache2 = foldersCache.getItem(folder => folder.id === childFolder2.id);
            expect(childFolderCache2?.permissions).toEqual([
                ...child1NewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${childFolderCache1?.id}`
                })),
                {
                    ...parentNewPermissions[1],
                    inheritedFrom: `parent:${childFolderCache1?.id}`
                }
            ]);

            const childFolderCache3 = foldersCache.getItem(folder => folder.id === childFolder3.id);
            expect(childFolderCache3?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${parentFolder?.id}`
                }))
            );
        }

        {
            // Let's remove childFolder1 permissions:
            // childFolder1 should inherit back permissions from parentFolder,
            // the change should be propagated to childFolder2, but not to childFolder3
            const newPermissions: FolderPermission[] = [];

            const gateway = new UpdateFolderMockGateway({
                id: childFolder1.id,
                title: childFolder1.title,
                slug: childFolder1.slug,
                parentId: childFolder1.parentId,
                permissions: newPermissions,
                type
            });

            const { updateFolder } = setupTest({ gateway, foldersCache });

            await updateFolder.execute({
                id: childFolder1.id,
                title: childFolder1.title,
                slug: childFolder1.slug,
                parentId: childFolder1.parentId,
                permissions: newPermissions,
                type
            });

            const childFolderCache1 = foldersCache.getItem(folder => folder.id === childFolder1.id);
            expect(childFolderCache1?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${parentFolder?.id}`
                }))
            );

            const childFolderCache2 = foldersCache.getItem(folder => folder.id === childFolder2.id);
            expect(childFolderCache2?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${childFolderCache1?.id}`
                }))
            );

            const childFolderCache3 = foldersCache.getItem(folder => folder.id === childFolder3.id);
            expect(childFolderCache3?.permissions).toEqual(
                parentNewPermissions.map(permission => ({
                    ...permission,
                    inheritedFrom: `parent:${parentFolder?.id}`
                }))
            );
        }
    });

    it("should propagate `path` changes to child folders", async () => {
        const parentFolder = Folder.create({
            id: "parent-folder-id",
            title: "Parent Folder",
            slug: "parent-folder",
            parentId: null,
            permissions: [],
            path: `${ROOT_FOLDER}/parent-folder`,
            type
        });

        const childFolder1 = Folder.create({
            id: "child-folder-id-1",
            title: "Child Folder 1",
            slug: "child-folder-1",
            parentId: parentFolder.id,
            permissions: [],
            path: `${ROOT_FOLDER}/parent-folder/child-folder-1`,
            type
        });

        const childFolder2 = Folder.create({
            id: "child-folder-id-2",
            title: "Child Folder 2",
            slug: "child-folder-2",
            parentId: childFolder1.id,
            permissions: [],
            path: `${ROOT_FOLDER}/parent-folder/child-folder-1/child-folder-2`,
            type
        });

        const childFolder3 = Folder.create({
            id: "child-folder-id-3",
            title: "Child Folder 3",
            slug: "child-folder-3",
            parentId: parentFolder.id, // <-- This folder is a sibling of childFolder1, not a child
            permissions: [],
            path: `${ROOT_FOLDER}/parent-folder/child-folder-3`,
            type
        });

        // Let's update parentFolder, the change should be propagated to all it's children (childFolder1, childFolder2 and childFolder3).
        const newParentPath: string = `${ROOT_FOLDER}/parent-folder-edit`;

        const foldersCache = new ListCache<Folder>();
        foldersCache.addItems([parentFolder, childFolder1, childFolder2, childFolder3]);

        {
            const gateway = new UpdateFolderMockGateway({
                id: parentFolder.id,
                title: parentFolder.title,
                slug: parentFolder.slug + "-edit",
                parentId: parentFolder.parentId,
                permissions: parentFolder.permissions,
                path: newParentPath,
                type
            });

            const { updateFolder } = setupTest({ gateway, foldersCache });

            await updateFolder.execute({
                id: parentFolder.id,
                title: parentFolder.title,
                slug: parentFolder.slug + "-edit",
                parentId: parentFolder.parentId,
                permissions: parentFolder.permissions,
                type
            });

            const childFolderCache1 = foldersCache.getItem(folder => folder.id === childFolder1.id);
            expect(childFolderCache1?.path).toEqual(`${newParentPath}/child-folder-1`);

            const childFolderCache2 = foldersCache.getItem(folder => folder.id === childFolder2.id);
            expect(childFolderCache2?.path).toEqual(
                `${newParentPath}/child-folder-1/child-folder-2`
            );

            const childFolderCache3 = foldersCache.getItem(folder => folder.id === childFolder3.id);
            expect(childFolderCache3?.path).toEqual(`${newParentPath}/child-folder-3`);
        }

        // Let's update childFolder1, the change should be propagated to childFolder2, but not to childFolder3
        const newChildFolder1Path: string = `${newParentPath}/child-folder-1-edit`;

        {
            const gateway = new UpdateFolderMockGateway({
                id: childFolder1.id,
                title: childFolder1.title,
                slug: childFolder1.slug + "-edit",
                parentId: childFolder1.parentId,
                permissions: childFolder1.permissions,
                path: newChildFolder1Path,
                type
            });

            const { updateFolder } = setupTest({ gateway, foldersCache });

            await updateFolder.execute({
                id: childFolder1.id,
                title: childFolder1.title,
                slug: childFolder1.slug + "-edit",
                parentId: childFolder1.parentId,
                permissions: childFolder1.permissions,
                type
            });

            const childFolderCache1 = foldersCache.getItem(folder => folder.id === childFolder1.id);
            expect(childFolderCache1?.path).toEqual(newChildFolder1Path);

            const childFolderCache2 = foldersCache.getItem(folder => folder.id === childFolder2.id);
            expect(childFolderCache2?.path).toEqual(`${newChildFolder1Path}/child-folder-2`);

            const childFolderCache3 = foldersCache.getItem(folder => folder.id === childFolder3.id);
            expect(childFolderCache3?.path).toEqual(`${newParentPath}/child-folder-3`);
        }
    });

    it("should handle gateway errors gracefully", async () => {
        class UpdateFolderErrorMockGateway implements UpdateFolderGateway.Interface {
            async execute(): Promise<FolderDto> {
                throw new Error("Gateway error");
            }
        }

        const gateway = new UpdateFolderErrorMockGateway();
        const spy = vi.spyOn(gateway, "execute");

        const { updateFolder } = setupTest({ gateway });

        await expect(
            updateFolder.execute({
                id: "any-folder-id",
                title: "Updated Folder",
                slug: "updated-folder",
                parentId: "another-id",
                permissions: [],
                type
            })
        ).rejects.toThrow("Gateway error");

        expect(spy).toHaveBeenCalledTimes(1);
    });
});
