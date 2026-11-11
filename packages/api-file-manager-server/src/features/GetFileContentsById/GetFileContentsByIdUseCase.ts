import { promises as fs } from "node:fs";
import { Result } from "@webiny/feature/api";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import { getStoragePath, resolveTenantFilePath } from "~/utils/storagePaths.js";

class GetFileContentsByIdUseCaseImpl implements GetFileContentsByIdUseCase.Interface {
    private readonly metadataReader: MetadataReader.Interface;

    public constructor(metadataReader: MetadataReader.Interface) {
        this.metadataReader = metadataReader;
    }

    public async execute(
        fileId: string
    ): Promise<Result<FileContents, GetFileContentsByIdUseCase.Error>> {
        const metadata = await this.metadataReader.read(fileId);
        if (!metadata) {
            return Result.fail(new FileNotFoundError(fileId));
        }

        let filePath: string;
        try {
            // Security: the key comes from the file record, never read outside the tenant's files.
            filePath = resolveTenantFilePath(getStoragePath(), metadata.tenant, metadata.bucketKey);
        } catch {
            return Result.fail(new FileNotFoundError(fileId));
        }

        try {
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
        dependencies: [MetadataReader]
    });
