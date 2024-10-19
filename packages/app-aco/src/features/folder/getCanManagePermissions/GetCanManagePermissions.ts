import { IGetCanManagePermissionsUseCase } from "./IGetCanManagePermissionsUseCase";
import { GetCanManagePermissionsRepository } from "./GetCanManagePermissionsRepository";
import { GetCanManagePermissionsWithFlpUseCase } from "./GetCanManagePermissionsWithFlpUseCase";
import { GetCanManagePermissionsUseCase } from "./GetCanManagePermissionsUseCase";
import { folderCacheFactory } from "~/features/folder";

export class GetCanManagePermissions {
    static cache: Map<string, IGetCanManagePermissionsUseCase> = new Map();

    public static instance(type: string, canUseFlp: boolean): IGetCanManagePermissionsUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const repository = new GetCanManagePermissionsRepository(foldersCache);

            if (canUseFlp) {
                return new GetCanManagePermissionsWithFlpUseCase(repository);
            }

            return new GetCanManagePermissionsUseCase();
        }

        // Return the cached instance
        return this.cache.get(type)!;
    }
}
