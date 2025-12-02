import { Result } from "@webiny/feature/api";
import { CreateFilesInBatchRepository as RepositoryAbstraction } from "./abstractions.js";
import type { File, FileInput } from "~/domain/file/types.js";
import { CreateFileRepository } from "~/features/file/CreateFile/abstractions.js";

class CreateFilesInBatchRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private createFileRepository: CreateFileRepository.Interface) {}

    async createBatch(files: FileInput[]): Promise<Result<File[], RepositoryAbstraction.Error>> {
        const results = await Promise.all(
            files.map(async input => {
                return this.createFileRepository.execute(input);
            })
        );

        // Return only successful results.
        // TODO: group files into successful and failed
        const createdFiles = results.filter(result => result.isOk()).map(result => result.value);

        return Result.ok(createdFiles);
    }
}

export const CreateFilesInBatchRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateFilesInBatchRepositoryImpl,
    dependencies: [CreateFileRepository]
});
