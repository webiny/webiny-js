import { Result } from "@webiny/feature/api";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";

class GetFileContentsByIdUseCaseImpl implements GetFileContentsByIdUseCase.Interface {
    private readonly metadataReader: MetadataReader.Interface;

    public constructor(
        metadataReader: MetadataReader.Interface,
        private readonly s3: S3,
        private readonly bucket: string
    ) {
        this.metadataReader = metadataReader;
    }

    public async execute(
        fileId: string
    ): Promise<Result<FileContents, GetFileContentsByIdUseCase.Error>> {
        const metadata = await this.metadataReader.read(fileId);
        if (!metadata) {
            return Result.fail(new FileNotFoundError(fileId));
        }

        try {
            const response = await this.s3.getObject({
                Bucket: this.bucket,
                Key: metadata.bucketKey
            });

            if (!response.Body) {
                return Result.fail(new FileNotFoundError(fileId));
            }

            const buffer = Buffer.from(await response.Body.transformToByteArray());
            return Result.ok({ buffer, contentType: metadata.contentType });
        } catch (error) {
            return Result.fail(
                new FilePersistenceError(error instanceof Error ? error : new Error(String(error)))
            );
        }
    }
}

export const GetFileContentsByIdUseCaseImplementation =
    GetFileContentsByIdUseCase.createImplementation({
        implementation: GetFileContentsByIdUseCaseImpl,
        dependencies: [MetadataReader, S3Client, S3Bucket]
    });
