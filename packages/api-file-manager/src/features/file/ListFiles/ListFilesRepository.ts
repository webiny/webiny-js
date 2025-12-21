import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import {
    ListFilesRepository as RepositoryAbstraction,
    ListFilesInput,
    ListFilesOutput
} from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { FilePersistenceError } from "~/domain/file/errors.js";
import { EntryToFileMapper } from "../shared/EntryToFileMapper.js";

class ListFilesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private fileModel: FileModel.Interface
    ) {}

    async execute(
        input: ListFilesInput
    ): Promise<Result<ListFilesOutput, RepositoryAbstraction.Error>> {
        const result = await this.listLatestEntries.execute(this.fileModel, {
            where: input.where || {},
            limit: input.limit || 40,
            after: input.after || undefined,
            sort: input.sort || ["id_DESC"],
            search: input.search
        });

        if (result.isFail()) {
            return Result.fail(new FilePersistenceError(result.error));
        }

        const [items, meta] = result.value;

        const files = items.map(entry => EntryToFileMapper.toFile(entry));

        return Result.ok({
            items: files,
            meta
        });
    }
}

export const ListFilesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListFilesRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, FileModel]
});
