import type { ListFoldersParams } from "~/folder/folder.types.js";
import { ListFoldersUseCase } from "../abstractions.js";
import { FolderAccessListFilter } from "~/features/flp/FolderAccessListFilter/index.js";

class ListFoldersWithFolderLevelPermissionsImpl implements ListFoldersUseCase.Interface {
    constructor(
        private folderAccessListFilter: FolderAccessListFilter.Interface,
        private decoratee: ListFoldersUseCase.Interface
    ) {}

    async execute(params: ListFoldersParams): ListFoldersUseCase.Return {
        return this.folderAccessListFilter.listFolders(params, params =>
            this.decoratee.execute(params)
        );
    }
}

export const ListFoldersWithFolderLevelPermissions = ListFoldersUseCase.createDecorator({
    decorator: ListFoldersWithFolderLevelPermissionsImpl,
    dependencies: [FolderAccessListFilter]
});
