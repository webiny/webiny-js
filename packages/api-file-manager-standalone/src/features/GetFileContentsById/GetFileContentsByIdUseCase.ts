import { Result } from "@webiny/feature/api";
import { GetFileContentsByIdUseCase as GetFileContentsByIdUseCaseAbstraction } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import { ObjectStorage } from "@webiny/api-object-storage";
import { isTenantFileKey } from "~/utils/isTenantFileKey.js";

class GetFileContentsByIdUseCaseImpl implements GetFileContentsByIdUseCaseAbstraction.Interface {
    private readonly metadataReader: MetadataReader.Interface;
    private readonly objectStorage: ObjectStorage.Interface;

    public constructor(
        metadataReader: MetadataReader.Interface,
        objectStorage: ObjectStorage.Interface
    ) {
        this.metadataReader = metadataReader;
        this.objectStorage = objectStorage;
    }

    public async execute(
        fileId: string
    ): Promise<Result<FileContents, GetFileContentsByIdUseCaseAbstraction.Error>> {
        const metadata = await this.metadataReader.read(fileId);
        if (!metadata) {
            return Result.fail(new FileNotFoundError(fileId));
        }

        // Security: the key comes from the file record, never read outside the tenant's files.
        if (!isTenantFileKey(metadata.tenant, metadata.bucketKey)) {
            return Result.fail(new FileNotFoundError(fileId));
        }

        try {
            const buffer = await this.objectStorage.get(metadata.bucketKey);
            if (!buffer) {
                return Result.fail(new FileNotFoundError(fileId));
            }
            return Result.ok({ buffer, contentType: metadata.contentType });
        } catch (error) {
            return Result.fail(
                new FilePersistenceError(error instanceof Error ? error : new Error(String(error)))
            );
        }
    }
}

export const GetFileContentsByIdUseCase =
    GetFileContentsByIdUseCaseAbstraction.createImplementation({
        implementation: GetFileContentsByIdUseCaseImpl,
        dependencies: [MetadataReader, ObjectStorage]
    });
