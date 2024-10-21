import { FoldersCache } from "../cache";
import { IGetFolderLevelPermissionRepository } from "./IGetFolderLevelPermissionRepository";
import { FolderPermissionName } from "./FolderPermissionName";

export class GetFolderLevelPermissionRepository implements IGetFolderLevelPermissionRepository {
    private cache: FoldersCache;
    private permissionName: FolderPermissionName;

    constructor(cache: FoldersCache, permissionName: FolderPermissionName) {
        this.cache = cache;
        this.permissionName = permissionName;
    }

    execute(id: string) {
        const folder = this.cache.getItem(id);

        if (!folder) {
            return false;
        }

        return folder[this.permissionName] ?? false;
    }
}
