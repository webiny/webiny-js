// @ts-nocheck TODO
import { describe, it, expect, beforeEach } from "vitest";
import { folderCacheFactory } from "../cache/FoldersCacheFactory.js";
import { Folder } from "../Folder.js";

describe("GetFolderLevelPermission", () => {
    const type = "abc";
    const foldersCache = folderCacheFactory.getCache(type);

    beforeEach(() => {
        foldersCache.clear();
        foldersCache.addItems([
            Folder.create({
                id: "folder-canManageContent",
                title: "Folder canManageContent",
                slug: "folder-canManageContent",
                parentId: null,
                permissions: [],
                canManageContent: true,
                type
            }),
            Folder.create({
                id: "folder-canManageStructure",
                title: "Folder canManageStructure",
                slug: "folder-canManageStructure",
                parentId: null,
                permissions: [],
                canManageStructure: true,
                type
            }),
            Folder.create({
                id: "folder-canManagePermissions",
                title: "Folder canManagePermissions3",
                slug: "folder-canManagePermissions",
                parentId: null,
                permissions: [],
                canManagePermissions: true,
                type
            }),
            Folder.create({
                id: "folder-no-permissions",
                title: "Folder No Permissions",
                slug: "folder-no-permissions",
                parentId: null,
                permissions: [],
                type
            })
        ]);
    });

    it("should return true in case a specific permission is set at folder level and FLP is enabled", async () => {
        // canManagePermissions
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManagePermissions",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-canManagePermissions"
            });
            expect(result).toBeTrue();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageStructure",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-canManageStructure"
            });
            expect(result).toBeTrue();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageContent",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-canManageContent"
            });
            expect(result).toBeTrue();
        }
    });

    it("should return false in case a specific permission is not set at folder level and FLP is enabled", async () => {
        // canManagePermissions
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManagePermissions",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-no-permissions"
            });
            expect(result).toBeFalse();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageStructure",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-no-permissions"
            });
            expect(result).toBeFalse();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageContent",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-no-permissions"
            });
            expect(result).toBeFalse();
        }
    });

    it("should return always false in case the folder is not found", async () => {
        // canManagePermissions
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManagePermissions",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "not-existing-folder"
            });
            expect(result).toBeFalse();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageStructure",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "not-existing-folder"
            });
            expect(result).toBeFalse();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageContent",
                true
            );

            const result = getFolderLevelPermission.execute({
                id: "not-existing-folder"
            });
            expect(result).toBeFalse();
        }
    });

    it("should return always true in case FLP is not enabled", async () => {
        // canManagePermissions
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManagePermissions",
                false
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-no-permissions"
            });
            expect(result).toBeTrue();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageStructure",
                false
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-no-permissions"
            });
            expect(result).toBeTrue();
        }

        // canManageStructure
        {
            const getFolderLevelPermission = GetFolderLevelPermission.getInstance(
                type,
                "canManageContent",
                false
            );

            const result = getFolderLevelPermission.execute({
                id: "folder-no-permissions"
            });
            expect(result).toBeTrue();
        }
    });
});
