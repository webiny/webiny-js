import { promises as fs } from "node:fs";
import { Result } from "@webiny/feature/api";
import { GetFileContentsByIdUseCase as GetFileContentsByIdUseCaseAbstraction } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import { FileManagerServerConfig } from "~/features/FileManagerServerConfig/abstractions.js";

class GetFileContentsByIdUseCaseImpl implements GetFileContentsByIdUseCaseAbstraction.Interface {
    private readonly metadataReader: MetadataReader.Interface;
    private readonly config: FileManagerServerConfig.Interface;

    public constructor(
        metadataReader: MetadataReader.Interface,
        config: FileManagerServerConfig.Interface
    ) {
        this.metadataReader = metadataReader;
        this.config = config;
    }

    public async execute(
        fileId: string
    ): Promise<Result<FileContents, GetFileContentsByIdUseCaseAbstraction.Error>> {
        const metadata = await this.metadataReader.read(fileId);
        if (!metadata) {
            return Result.fail(new FileNotFoundError(fileId));
        }

        const storagePath = this.config.storagePath;

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

export const GetFileContentsByIdUseCase =
    GetFileContentsByIdUseCaseAbstraction.createImplementation({
        implementation: GetFileContentsByIdUseCaseImpl,
        dependencies: [MetadataReader, FileManagerServerConfig]
    });
