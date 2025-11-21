import { Result } from "@webiny/feature/api";
import { CreateFileRepository as RepositoryAbstraction } from "./abstractions.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { FileModel } from "~/domain/file/abstractions.js";
import type { File, FileInput } from "~/domain/file/types.js";
import { EntryToFileMapper } from "../shared/EntryToFileMapper.js";
import { FilePersistenceError } from "~/domain/file/errors.js";

class CreateFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private fileModel: FileModel.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(data: FileInput): Promise<Result<File, RepositoryAbstraction.Error>> {
        const result = await this.identityContext.withoutAuthorization(async () => {
            return await this.createEntry.execute(this.fileModel, data);
        });

        if (result.isFail()) {
            return Result.fail(new FilePersistenceError(result.error));
        }

        const file = EntryToFileMapper.toFile(result.value);
        return Result.ok(file);
    }
}

export const CreateFileRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateFileRepositoryImpl,
    dependencies: [CreateEntryUseCase, FileModel, IdentityContext]
});
