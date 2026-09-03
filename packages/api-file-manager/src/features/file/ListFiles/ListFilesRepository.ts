import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import {
    ListFilesInput,
    ListFilesOutput,
    ListFilesRepository as RepositoryAbstraction
} from "./abstractions.js";
import { FileModelProvider } from "~/domain/file/abstractions.js";
import { FilePersistenceError } from "~/domain/file/errors.js";
import { EntryToFileMapper } from "../shared/EntryToFileMapper.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { CmsSortMapper } from "@webiny/api-headless-cms";
import { GenericRecord } from "@webiny/api/types.js";

class ListFilesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private fileModelProvider: FileModelProvider.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private cmsSortMapper: CmsSortMapper.Interface
    ) {}

    async execute(
        input: ListFilesInput
    ): Promise<Result<ListFilesOutput, RepositoryAbstraction.Error>> {
        const fileModel = await this.fileModelProvider.get();

        const where = this.cmsWhereMapper.map<GenericRecord>({
            input: input.where || {},
            fields: fileModel.fields
        });

        const sort = this.cmsSortMapper.map({
            input: input.sort,
            fields: fileModel.fields
        });

        const result = await this.listLatestEntries.execute(fileModel, {
            where,
            limit: input.limit || 40,
            after: input.after || undefined,
            sort: sort || ["id_DESC"],
            search: input.search
        });

        if (result.isFail()) {
            return Result.fail(new FilePersistenceError(result.error));
        }

        const { entries, meta } = result.value;

        const files = entries.map(entry => EntryToFileMapper.toFile(entry));

        return Result.ok({
            items: files,
            meta
        });
    }
}

export const ListFilesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListFilesRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, FileModelProvider, CmsWhereMapper, CmsSortMapper]
});
