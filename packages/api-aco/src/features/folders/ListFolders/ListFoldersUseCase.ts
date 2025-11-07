import { createImplementation } from "@webiny/feature/api";
import { ListFoldersUseCase as UseCaseAbstraction } from "./abstractions.js";
import type {
    AcoFolderStorageOperations,
    Folder,
    ListFoldersParams
} from "~/folder/folder.types.js";
import type { ListMeta } from "~/types.js";
import { FolderStorageOperations } from "~/features/folders/shared/abstractions.js";

class ListFoldersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private storageOperations: AcoFolderStorageOperations) {}

    async execute(params: ListFoldersParams): Promise<[Folder[], ListMeta]> {
        return await this.storageOperations.listFolders(params);
    }
}

export const ListFoldersUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListFoldersUseCaseImpl,
    dependencies: [FolderStorageOperations]
});
