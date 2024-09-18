import { LoadingRepository } from "@webiny/app-utils";
import { FoldersCache } from "~/folders/cache";
import { Folder } from "~/folders/domain";
import { ROOT_FOLDER } from "~/constants";
import { FolderItem } from "~/types";

export class FoldersPresenter {
    private foldersCache: FoldersCache;
    private loadingRepository: LoadingRepository;

    constructor(foldersCache: FoldersCache, loadingRepository: LoadingRepository) {
        this.foldersCache = foldersCache;
        this.loadingRepository = loadingRepository;
    }

    get vm() {
        return {
            folders: this.foldersCache.getItems().map(folder => this.folderMapper(folder)),
            loading: this.loadingRepository.get()
        };
    }

    private folderMapper(folder: Folder): FolderItem {
        return {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            type: folder.type,
            parentId: folder.parentId ?? ROOT_FOLDER,
            permissions: folder.permissions,
            hasNonInheritedPermissions: folder.hasNonInheritedPermissions ?? false,
            canManagePermissions: folder.canManagePermissions ?? false,
            canManageStructure: folder.canManageStructure ?? false,
            canManageContent: folder.canManageContent ?? false,
            createdBy: folder.createdBy ?? { id: "", type: "", displayName: "" },
            createdOn: folder.createdOn ?? "",
            savedBy: folder.savedBy ?? { id: "", type: "", displayName: "" },
            savedOn: folder.savedOn ?? "",
            modifiedBy: folder.modifiedBy ?? null,
            modifiedOn: folder.modifiedOn ?? null
        };
    }
}
