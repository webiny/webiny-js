import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { GetFileRepository as RepositoryAbstraction } from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import type { File } from "~/domain/file/types.js";
import { FileNotFoundError, FilePersistenceError } from "~/domain/file/errors.js";
import { EntryToFileMapper } from "../shared/EntryToFileMapper.js";

class GetFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private fileModel: FileModel.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async getById(id: string): Promise<Result<File, RepositoryAbstraction.Error>> {
        const result = await this.identityContext.withoutAuthorization(async () => {
            return await this.getEntryById.execute(this.fileModel, id);
        });

        if (result.isFail()) {
            const error = result.error;
            if (error.code === "Cms/Entry/NotFound") {
                return Result.fail(new FileNotFoundError(id));
            }
            return Result.fail(new FilePersistenceError(result.error));
        }

        const file = EntryToFileMapper.toFile(result.value);

        return Result.ok(file);
    }
}

export const GetFileRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFileRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, FileModel, IdentityContext]
});
