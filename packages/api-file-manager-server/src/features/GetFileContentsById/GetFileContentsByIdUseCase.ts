import { promises as fs } from "node:fs";
import { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { MetadataReader } from "~/features/WriteFileMetadata/MetadataReader.js";

class GetFileContentsByIdUseCaseImpl implements GetFileContentsByIdUseCase.Interface {
    private readonly metadataReader: MetadataReader;

    constructor(keyValueStore: GlobalKeyValueStore.Interface) {
        this.metadataReader = new MetadataReader(keyValueStore);
    }

    async execute(fileId: string): Promise<Result<FileContents, GetFileContentsByIdUseCase.Error>> {
        const metadata = await this.metadataReader.read(fileId);
        if (!metadata) {
            return Result.fail(new FileNotFoundError(fileId));
        }

        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);

        try {
            const filePath = `${storagePath}/${metadata.bucketKey}`;
            const buffer = await fs.readFile(filePath);
            return Result.ok({ buffer, contentType: metadata.contentType });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return Result.fail(new FileNotFoundError(fileId));
            }
            return Result.fail(
                new FilePersistenceError(error instanceof Error ? error : new Error(String(error)))
            );
        }
    }
}

export const GetFileContentsByIdUseCaseImplementation =
    GetFileContentsByIdUseCase.createImplementation({
        implementation: GetFileContentsByIdUseCaseImpl,
        dependencies: [GlobalKeyValueStore]
    });
