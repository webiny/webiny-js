import { FoldersCache } from "../cache";
import { IGetCanManagePermissionsRepository } from "./IGetCanManagePermissionsRepository";

export class GetCanManagePermissionsRepository implements IGetCanManagePermissionsRepository {
    private cache: FoldersCache;

    constructor(cache: FoldersCache) {
        this.cache = cache;
    }

    execute(id: string) {
        const folder = this.cache.getItem(id);

        if (!folder) {
            return false;
        }

        return folder.canManagePermissions ?? false;
    }
}
