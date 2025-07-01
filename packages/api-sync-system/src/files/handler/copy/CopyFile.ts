import type {
    AbortMultipartUploadCommandInput,
    CompletedPart,
    CompleteMultipartUploadCommandInput,
    CopyObjectCommandInput,
    CopyObjectCommandOutput,
    CreateMultipartUploadCommandInput,
    HeadObjectCommandInput,
    S3Client,
    UploadPartCopyCommandInput
} from "@webiny/aws-sdk/client-s3/index.js";
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    HeadObjectCommand,
    UploadPartCopyCommand
} from "@webiny/aws-sdk/client-s3/index.js";
import bytes from "bytes";
import { convertException } from "@webiny/utils";

type ByteSize = number | `${number}B` | `${number}KB` | `${number}MB` | `${number}GB`;

export interface ICopyFileParams {
    getS3Client: (region: string) => S3Client;
    sourceRegion: string;
    targetRegion: string;
    maxConcurrency?: number;
    minPartSize?: ByteSize;
    maxPartSize?: ByteSize;
}

export interface ICopyParams {
    key: string;
    sourceBucket: string;
    targetBucket: string;
}

export interface IHeadObjectParams {
    client: S3Client;
    bucket: string;
    key: string;
}

export interface ICreateMultipartUploadParams {
    targetBucket: string;
    targetKey: string;
}

export interface IUploadPartCopyParams {
    sourceBucket: string;
    sourceKey: string;
    targetBucket: string;
    targetKey: string;
    uploadId: string;
    partNumber: number;
    start: number;
    end: number;
    completedParts: CompletedPart[];
}

export interface ICompleteMultipartUploadParams {
    targetBucket: string;
    targetKey: string;
    uploadId: string;
    completedParts: CompletedPart[];
}

export interface IAbortMultipartUploadParams {
    targetBucket: string;
    targetKey: string;
    uploadId: string;
}

interface ICopyMetadataParams {
    sourceBucket: string;
    targetBucket: string;
    key: string;
}

export class CopyFile {
    private readonly sourceClient: S3Client;
    private readonly targetClient: S3Client;
    private readonly maxConcurrency: number;
    private readonly minPartSizeBytes: number;
    private readonly maxPartSizeBytes: number;

    public constructor(params: ICopyFileParams) {
        const {
            getS3Client,
            sourceRegion,
            targetRegion,
            maxConcurrency = 100,
            minPartSize = "5MB",
            maxPartSize = "1GB"
        } = params;

        this.sourceClient = getS3Client(sourceRegion);
        this.targetClient = getS3Client(targetRegion);
        this.maxConcurrency = maxConcurrency;

        this.minPartSizeBytes = this.parseByteSize(minPartSize);
        this.maxPartSizeBytes = this.parseByteSize(maxPartSize);

        if (this.minPartSizeBytes < 5 * 1024 * 1024) {
            throw new Error("minPartSize must be at least 5MB");
        }
    }

    private parseByteSize(value: ByteSize): number {
        if (typeof value === "number") {
            return value;
        }
        const parsed = bytes.parse(value);
        if (typeof parsed === "number") {
            return parsed;
        }
        throw new Error(`Invalid byte size value: ${value}`);
    }

    private async headObject(params: IHeadObjectParams) {
        const { client, bucket, key } = params;
        const input: HeadObjectCommandInput = {
            Bucket: bucket,
            Key: key
        };
        const command = new HeadObjectCommand(input);
        return await client.send(command);
    }

    private async createMultipartUpload(params: ICreateMultipartUploadParams): Promise<string> {
        const { targetBucket, targetKey } = params;
        const input: CreateMultipartUploadCommandInput = {
            Bucket: targetBucket,
            Key: targetKey
        };
        const command = new CreateMultipartUploadCommand(input);
        const response = await this.targetClient.send(command);
        if (!response.UploadId) {
            throw new Error("Failed to create multipart upload");
        }
        return response.UploadId;
    }

    private async uploadPartCopy(params: IUploadPartCopyParams): Promise<void> {
        const {
            sourceBucket,
            sourceKey,
            targetBucket,
            targetKey,
            uploadId,
            partNumber,
            start,
            end,
            completedParts
        } = params;

        const input: UploadPartCopyCommandInput = {
            Bucket: targetBucket,
            Key: targetKey,
            UploadId: uploadId,
            PartNumber: partNumber,
            CopySource: encodeURIComponent(`${sourceBucket}/${sourceKey}`),
            CopySourceRange: `bytes=${start}-${end}`
        };

        const command = new UploadPartCopyCommand(input);
        const response = await this.targetClient.send(command);

        if (!response.CopyPartResult?.ETag) {
            throw new Error(`UploadPartCopy failed for part ${partNumber}`);
        }

        completedParts.push({
            ETag: response.CopyPartResult.ETag,
            PartNumber: partNumber
        });
    }

    private async completeMultipartUpload(params: ICompleteMultipartUploadParams) {
        const { targetBucket, targetKey, uploadId, completedParts } = params;

        const sortedParts = [...completedParts].sort((a, b) => {
            return a.PartNumber! - b.PartNumber!;
        });

        const input: CompleteMultipartUploadCommandInput = {
            Bucket: targetBucket,
            Key: targetKey,
            UploadId: uploadId,
            MultipartUpload: { Parts: sortedParts }
        };

        const command = new CompleteMultipartUploadCommand(input);
        await this.targetClient.send(command);
    }

    private async abortMultipartUpload(params: IAbortMultipartUploadParams) {
        const { targetBucket, targetKey, uploadId } = params;

        const input: AbortMultipartUploadCommandInput = {
            Bucket: targetBucket,
            Key: targetKey,
            UploadId: uploadId
        };
        const command = new AbortMultipartUploadCommand(input);
        await this.targetClient.send(command);
    }

    public async copy(params: ICopyParams): Promise<void> {
        const { key, sourceBucket, targetBucket } = params;

        const sourceHead = await this.headObject({
            client: this.sourceClient,
            bucket: sourceBucket,
            key
        });

        if (!sourceHead?.ContentLength || !sourceHead.ETag) {
            throw new Error("Source object metadata is invalid or missing");
        }

        let targetHead;
        try {
            targetHead = await this.headObject({
                client: this.targetClient,
                bucket: targetBucket,
                key
            });
        } catch {
            targetHead = null;
        }

        if (targetHead?.ChecksumSHA256 === sourceHead.ChecksumSHA256) {
            return;
        }

        const totalSize = sourceHead.ContentLength;
        let partSize = Math.max(
            this.minPartSizeBytes,
            Math.min(this.maxPartSizeBytes, Math.ceil(totalSize / this.maxConcurrency))
        );
        partSize = Math.min(partSize, totalSize);

        const uploadId = await this.createMultipartUpload({
            targetBucket,
            targetKey: key
        });
        const completedParts: CompletedPart[] = [];

        try {
            let partNumber = 1;
            let start = 0;
            const promises: Promise<void>[] = [];
            let active = 0;

            while (start < totalSize) {
                const end = Math.min(start + partSize - 1, totalSize - 1);

                const copyPromise = this.uploadPartCopy({
                    sourceBucket,
                    sourceKey: key,
                    targetBucket,
                    targetKey: key,
                    uploadId,
                    partNumber,
                    start,
                    end,
                    completedParts
                });

                promises.push(copyPromise);
                active++;

                if (active >= this.maxConcurrency) {
                    await Promise.race(promises);
                    active--;
                }

                partNumber++;
                start += partSize;
            }

            await Promise.all(promises);
            /**
             * Complete the multipart upload with all the completed parts.
             */
            console.log(`Completing multipart upload for ${key} to ${targetBucket}`);
            await this.completeMultipartUpload({
                targetBucket,
                targetKey: key,
                uploadId,
                completedParts
            });
        } catch (ex) {
            await this.abortMultipartUpload({ targetBucket, targetKey: key, uploadId });
            throw ex;
        }
        /**
         * And then copy the metadata file.
         */

        try {
            console.log(`Copying metadata for ${key} from ${sourceBucket} to ${targetBucket}`);
            const result = await this.copyMetadata({
                sourceBucket,
                targetBucket,
                key
            });
            console.log({
                havingResult: true,
                copyMetadataResult: result
            });
        } catch (ex) {
            console.error(
                `Failed to copy metadata for ${key} from ${sourceBucket} to ${targetBucket}.`
            );
            console.log(convertException(ex));
        }
    }

    private async copyMetadata(
        params: ICopyMetadataParams
    ): Promise<CopyObjectCommandOutput | null> {
        const { sourceBucket, targetBucket, key } = params;

        const metadataKey = `${key}.metadata`;

        const [sourceMetadata, targetMetadata] = await Promise.all([
            this.headObject({
                client: this.sourceClient,
                bucket: sourceBucket,
                key: metadataKey
            }).catch(() => null),
            this.headObject({
                client: this.targetClient,
                bucket: targetBucket,
                key: metadataKey
            }).catch(() => null)
        ]);

        if (!sourceMetadata?.ChecksumSHA256 || !sourceMetadata.ChecksumSHA256) {
            return null;
        }

        if (targetMetadata?.ChecksumSHA256 === sourceMetadata.ChecksumSHA256) {
            return null;
        }

        const input: CopyObjectCommandInput = {
            Bucket: targetBucket,
            Key: metadataKey,
            CopySource: encodeURIComponent(`${sourceBucket}/${metadataKey}`)
        };

        const command = new CopyObjectCommand(input);

        return await this.targetClient.send(command);
    }
}
