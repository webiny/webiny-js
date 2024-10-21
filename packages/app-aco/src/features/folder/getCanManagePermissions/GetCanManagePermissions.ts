import { IGetCanManagePermissionsUseCase } from "./IGetCanManagePermissionsUseCase";
import { GetCanManagePermissionsRepository } from "./GetCanManagePermissionsRepository";
import { GetCanManagePermissionsWithFlpUseCase } from "./GetCanManagePermissionsWithFlpUseCase";
import { GetCanManagePermissionsUseCase } from "./GetCanManagePermissionsUseCase";
import { folderCacheFactory } from "~/features/folder";

export class GetCanManagePermissions {
    public static instance(type: string, canUseFlp: boolean): IGetCanManagePermissionsUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const repository = new GetCanManagePermissionsRepository(foldersCache);

        if (canUseFlp) {
            return new GetCanManagePermissionsWithFlpUseCase(repository);
        }

        return new GetCanManagePermissionsUseCase();
    }
}
