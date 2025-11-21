import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { UpdateFileRepository as RepositoryAbstraction } from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import type { File } from "~/domain/file/types.js";
import { FileNotFoundError, FilePersistenceError } from "~/domain/file/errors.js";
import { FileToEntryMapper } from "../shared/FileToEntryMapper.js";

class UpdateFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private fileModel: FileModel.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async update(file: File): Promise<Result<void, RepositoryAbstraction.Error>> {
        const entry = FileToEntryMapper.toEntry(file);

        const valuesToUpdate = {
            wbyAco_location: file.location,
            ...entry.values
        };

        // Files are not versioned, so we're always updating the same revision
        const id = `${file.id}#0001`;

        const result = await this.identityContext.withoutAuthorization(async () => {
            return await this.updateEntry.execute(this.fileModel, id, valuesToUpdate);
        });

        if (result.isFail()) {
            const error = result.error;
            if (error.code === "Cms/Entry/NotFound") {
                return Result.fail(new FileNotFoundError(id));
            }
            return Result.fail(new FilePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const UpdateFileRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateFileRepositoryImpl,
    dependencies: [UpdateEntryUseCase, FileModel, IdentityContext]
});
