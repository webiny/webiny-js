import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import {
    ListFilesInput,
    ListFilesOutput,
    ListFilesRepository as RepositoryAbstraction
} from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { FilePersistenceError } from "~/domain/file/errors.js";
import { EntryToFileMapper } from "../shared/EntryToFileMapper.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { GenericRecord } from "@webiny/api/types.js";

class ListFilesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private fileModel: FileModel.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface
    ) {}

    async execute(
        input: ListFilesInput
    ): Promise<Result<ListFilesOutput, RepositoryAbstraction.Error>> {
        const where = this.cmsWhereMapper.map<GenericRecord>({
            input: input.where || {},
            fields: this.fileModel.fields
        });

        const result = await this.listLatestEntries.execute(this.fileModel, {
            where,
            limit: input.limit || 40,
            after: input.after || undefined,
            sort: input.sort || ["id_DESC"],
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
    dependencies: [ListLatestEntriesUseCase, FileModel, CmsWhereMapper]
});
