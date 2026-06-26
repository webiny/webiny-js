import { Result } from "@webiny/feature/api";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";

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

        try {
            const s3 = new S3();
            const bucket = String(process.env.S3_BUCKET);
            const response = await s3.getObject({ Bucket: bucket, Key: metadata.bucketKey });

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
        dependencies: [MetadataReader]
    });
