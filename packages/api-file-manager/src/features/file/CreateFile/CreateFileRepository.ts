import { Result } from "@webiny/feature/api";
import { CreateFileRepository as RepositoryAbstraction } from "./abstractions.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { FileModel } from "~/domain/file/abstractions.js";
import type { File, FileInput } from "~/domain/file/types.js";
import { EntryToFileMapper } from "../shared/EntryToFileMapper.js";
import { FileNotAuthorizedError, FilePersistenceError } from "~/domain/file/errors.js";
import { FileInputToEntryInputMapper } from "~/features/file/shared/FileInputToEntryInputMapper.js";

class CreateFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private fileModel: FileModel.Interface
    ) {}

    async execute(data: FileInput): Promise<Result<File, RepositoryAbstraction.Error>> {
        const result = await this.createEntry.execute(
            this.fileModel,
            FileInputToEntryInputMapper.toEntry(data)
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotAuthorized") {
                return Result.fail(new FileNotAuthorizedError());
            }

            return Result.fail(new FilePersistenceError(result.error));
        }

        const file = EntryToFileMapper.toFile(result.value);
        return Result.ok(file);
    }
}

export const CreateFileRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateFileRepositoryImpl,
    dependencies: [CreateEntryUseCase, FileModel]
});
