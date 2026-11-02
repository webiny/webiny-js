import { GetFlpUseCase } from "@webiny/api-aco/features/flp/GetFlp/index.js";
import type {
    FolderAccessLevel,
    FolderLevelPermission,
    FolderPermission
} from "@webiny/api-aco/types.js";
import { folderLevels, toFolderPermissions } from "./FakeFolderLevelPermissions.js";

/** Folder id → team slug → access level, stored as `team:<slug>` grants. Reset it in `afterEach`. */
export const folderTeamLevels = new Map<string, Map<string, FolderAccessLevel>>();

/** How many folder permission records were read. Reset it in `afterEach`. */
export const folderRecordReads = { count: 0 };

/**
 * The stored folder permission records, from `folderLevels` and `folderTeamLevels`; a folder in
 * neither has no record.
 * Register it with `FakeFolderLevelPermissions`, whose evaluation it feeds.
 */
class FakeGetFlpImpl implements GetFlpUseCase.Interface {
    public async execute(id: string): Promise<FolderLevelPermission | null> {
        folderRecordReads.count++;
        const levels = folderLevels.get(id);
        const teamLevels = folderTeamLevels.get(id);
        if (!levels && !teamLevels) {
            return null;
        }
        const permissions: FolderPermission[] = levels ? toFolderPermissions(levels) : [];
        for (const [slug, level] of teamLevels ?? []) {
            permissions.push({ target: `team:${slug}`, level });
        }
        return {
            id,
            parentId: "root",
            slug: id,
            path: id,
            type: "fake",
            permissions
        };
    }
}

export const FakeGetFlp = GetFlpUseCase.createImplementation({
    implementation: FakeGetFlpImpl,
    dependencies: []
});
