import { Result } from "@webiny/feature/api";
import {
    ListFoldersRepository as RepositoryAbstraction,
    type IListFoldersRepository
} from "./abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { FolderModel } from "~/domain/folder/abstractions.js";
import type { ListFoldersParams } from "~/folder/folder.types.js";
import { EntryToFolderMapper } from "../shared/EntryToFolderMapper.js";
import { FolderPersistenceError } from "~/domain/folder/errors.js";
import { createListSort } from "~/utils/createListSort.js";
import type { ListSort } from "~/types.js";

class ListFoldersRepositoryImpl implements IListFoldersRepository {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private folderModel: FolderModel.Interface
    ) {}

    async execute(params: ListFoldersParams): RepositoryAbstraction.Return {
        const { sort, where } = params;

        const listSort =
            sort ||
            ({
                title: "ASC"
            } as unknown as ListSort);

        const result = await this.listLatestEntries.execute(this.folderModel, {
            ...params,
            sort: createListSort(listSort),
            where: {
                ...(where || {})
            }
        });

        if (result.isFail()) {
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const { entries, meta } = result.value;
        const folders = entries.map(entry => EntryToFolderMapper.toFolder(entry));
        return Result.ok({ folders, meta });
    }
}

export const ListFoldersRepository = RepositoryAbstraction.createImplementation({
    implementation: ListFoldersRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, FolderModel]
});
