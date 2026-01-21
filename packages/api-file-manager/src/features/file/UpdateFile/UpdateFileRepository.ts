import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { UpdateFileRepository as RepositoryAbstraction } from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import type { File } from "~/domain/file/types.js";
import {
    FileNotAuthorizedError,
    FileNotFoundError,
    FilePersistenceError
} from "~/domain/file/errors.js";
import { FileToEntryMapper } from "../shared/FileToEntryMapper.js";

class UpdateFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private fileModel: FileModel.Interface
    ) {}

    async update(file: File): Promise<Result<void, RepositoryAbstraction.Error>> {
        const entry = FileToEntryMapper.toEntry(file);

        // Files are not versioned, so we're always updating the same revision
        const id = `${file.id}#0001`;

        const result = await this.updateEntry.execute(this.fileModel, id, {
            wbyAco_location: file.location,
            values: entry.values
        });

        if (result.isFail()) {
            const error = result.error;
            if (error.code === "Cms/Entry/NotFound") {
                return Result.fail(new FileNotFoundError(id));
            }

            if (error.code === "Cms/Entry/NotAuthorized") {
                return Result.fail(new FileNotAuthorizedError());
            }

            return Result.fail(new FilePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const UpdateFileRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateFileRepositoryImpl,
    dependencies: [UpdateEntryUseCase, FileModel]
});
