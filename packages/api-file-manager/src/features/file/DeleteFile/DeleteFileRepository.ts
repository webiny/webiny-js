import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { DeleteFileRepository as RepositoryAbstraction } from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { FileNotFoundError, FilePersistenceError } from "~/domain/file/errors.js";
import { File } from "~/domain/file/types.js";

class DeleteFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private fileModel: FileModel.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async delete(file: File): Promise<Result<void, RepositoryAbstraction.Error>> {
        // Files are not versioned, so we're always deleting the same revision
        const entryId = `${file.id}#0001`;

        const result = await this.identityContext.withoutAuthorization(async () => {
            return await this.deleteEntry.execute(this.fileModel, entryId);
        });

        if (result.isFail()) {
            const error = result.error;
            if (error.code === "Cms/Entry/NotFound") {
                return Result.fail(new FileNotFoundError(file.id));
            }
            return Result.fail(new FilePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeleteFileRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteFileRepositoryImpl,
    dependencies: [DeleteEntryUseCase, FileModel, IdentityContext]
});
