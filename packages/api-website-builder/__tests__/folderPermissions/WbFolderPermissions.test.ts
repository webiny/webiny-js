import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { FolderTypePermissions } from "@webiny/api-aco/features/folder/FolderTypePermissions/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { WbFolderPermissions } from "~/features/folderPermissions/WbFolderPermissions.js";

const resolve = (canRead: boolean, canEdit: boolean) => {
    const container = new Container();
    container.registerInstance(WbPermissions, {
        canRead: vi.fn().mockResolvedValue(canRead),
        canEdit: vi.fn().mockResolvedValue(canEdit)
    } as unknown as WbPermissions.Interface);
    container.register(WbFolderPermissions);
    return container.resolve(FolderTypePermissions);
};

describe("WbFolderPermissions", () => {
    it.each(["wb:page", "wb:redirect"])("should handle %s folders", type => {
        expect(resolve(true, true).canHandle(type)).toBe(true);
    });

    it.each(["WbPage", "FmFile", "cms:article", "constructor", "toString"])(
        "should not handle %s folders",
        type => {
            expect(resolve(true, true).canHandle(type)).toBe(false);
        }
    );

    it("should use Website Builder read and edit permissions", async () => {
        const permissions = resolve(false, false);
        await expect(permissions.canRead("wb:page")).resolves.toBe(false);
        await expect(permissions.canWrite("wb:redirect")).resolves.toBe(false);
    });
});
