import type { ListFoldersUseCase as UseCaseAbstraction } from "./abstractions.js";
import type {
    AcoFolderStorageOperations,
    Folder,
    ListFoldersParams
} from "~/folder/folder.types.js";
import type { ListMeta } from "~/types.js";

export class ListFoldersUseCase implements UseCaseAbstraction.Interface {
    constructor(private storageOperations: AcoFolderStorageOperations) {}

    async execute(params: ListFoldersParams): Promise<[Folder[], ListMeta]> {
        return await this.storageOperations.listFolders(params);
    }
}
