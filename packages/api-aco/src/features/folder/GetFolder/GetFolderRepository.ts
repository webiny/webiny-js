import { Result } from "@webiny/feature/api";
import {
    GetFolderRepository as RepositoryAbstraction,
    type IGetFolderRepository
} from "./abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { FolderModel } from "~/domain/folder/abstractions.js";
import type { CmsEntryFolder, Folder } from "~/folder/folder.types.js";
import { EntryToFolderMapper } from "../shared/EntryToFolderMapper.js";
import { FolderNotFoundError, FolderPersistenceError } from "~/domain/folder/errors.js";

class GetFolderRepositoryImpl implements IGetFolderRepository {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private folderModel: FolderModel.Interface
    ) {}

    async execute(id: string): Promise<Result<Folder, RepositoryAbstraction.Error>> {
        const result = await this.getEntryById.execute<CmsEntryFolder>(this.folderModel, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new FolderNotFoundError(id));
            }

            return Result.fail(new FolderPersistenceError(result.error));
        }

        const folder = EntryToFolderMapper.toFolder(result.value);
        return Result.ok(folder);
    }
}

export const GetFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFolderRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, FolderModel]
});
