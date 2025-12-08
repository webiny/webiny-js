import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { ListCache } from "~/features/folders/cache/index.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { GetFolderLevelPermissionFeature } from "~/features/folders/getFolderLevelPermission/feature.js";
import { GetFolderLevelPermissionUseCase } from "~/features/folders/getFolderLevelPermission/abstractions.js";
import { WcpService } from "@webiny/app-admin/features/wcp/abstractions.js";
import { Folder } from "~/domain/folder/Folder.js";
import type { ILicense } from "@webiny/wcp/types";
import { License, WCP_FEATURE_LABEL } from "@webiny/wcp";

class WcpServiceMock implements WcpService.Interface {
    private readonly license: ILicense;

    constructor(flpEnabled: boolean) {
        this.license = License.fromLicenseDto(
            createTestWcpLicense({ folderLevelPermissions: flpEnabled })
        );
    }

    canUseFeature(featureName: keyof typeof WCP_FEATURE_LABEL): boolean {
        return this.license.canUseFeature(featureName);
    }

    getProject(): ILicense {
        return this.license;
    }

    isLoaded(): boolean {
        return true;
    }

    loadProject(): Promise<void> {
        return Promise.resolve(undefined);
    }
}

describe("GetFolderLevelPermission", () => {
    const type = "abc";

    function setupTest(params: { flpEnabled: boolean }) {
        const { flpEnabled } = params;
        const container = new Container();
        const foldersCache = new ListCache<Folder>();

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

        container.registerInstance(WcpService, new WcpServiceMock(flpEnabled));
        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);

        GetFolderLevelPermissionFeature.register(container);

        return {
            container,
            foldersCache,
            useCase: container.resolve(GetFolderLevelPermissionUseCase)
        };
    }

    it("should return true in case a specific permission is set at folder level and FLP is enabled", async () => {
        const { useCase } = setupTest({ flpEnabled: true });

        // canManagePermissions
        {
            const result = useCase.execute("folder-canManagePermissions", "canManagePermissions");
            expect(result).toBe(true);
        }

        // canManageStructure
        {
            const result = useCase.execute("folder-canManageStructure", "canManageStructure");
            expect(result).toBe(true);
        }

        // canManageStructure
        {
            const result = useCase.execute("folder-canManageContent", "canManageContent");

            expect(result).toBe(true);
        }
    });

    it("should return false in case a specific permission is not set at folder level and FLP is enabled", async () => {
        const { useCase } = setupTest({ flpEnabled: true });
        // canManagePermissions
        {
            const result = useCase.execute("folder-no-permissions", "canManagePermissions");
            expect(result).toBe(false);
        }

        // canManageStructure
        {
            const result = useCase.execute("folder-no-permissions", "canManageStructure");

            expect(result).toBe(false);
        }

        // canManageContent
        {
            const result = useCase.execute("folder-no-permissions", "canManageContent");

            expect(result).toBe(false);
        }
    });

    it("should return always false in case the folder is not found", async () => {
        const { useCase } = setupTest({ flpEnabled: true });

        // canManagePermissions
        {
            const result = useCase.execute("not-existing-folder", "canManagePermissions");

            expect(result).toBe(false);
        }

        // canManageStructure
        {
            const result = useCase.execute("not-existing-folder", "canManageStructure");

            expect(result).toBe(false);
        }

        // canManageContent
        {
            const result = useCase.execute("not-existing-folder", "canManageContent");

            expect(result).toBe(false);
        }
    });

    it("should return always true in case FLP is not enabled", async () => {
        const { useCase } = setupTest({ flpEnabled: false });

        // canManagePermissions
        {
            const result = useCase.execute("folder-no-permissions", "canManagePermissions");

            expect(result).toBe(true);
        }

        // canManageStructure
        {
            const result = useCase.execute("folder-no-permissions", "canManageStructure");

            expect(result).toBe(true);
        }

        // canManageContent
        {
            const result = useCase.execute("folder-no-permissions", "canManageContent");

            expect(result).toBe(true);
        }
    });
});
