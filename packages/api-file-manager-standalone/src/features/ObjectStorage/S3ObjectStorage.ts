import pMap from "p-map";
import { AbortMultipartUploadCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CompleteMultipartUploadCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CreateMultipartUploadCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { DeleteObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { GetObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { HeadObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { ListMultipartUploadsCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { ListObjectsV2Command } from "@webiny/aws-sdk/client-s3/index.js";
import { ListPartsCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { UploadPartCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import type { CompletedPart } from "@webiny/aws-sdk/client-s3/index.js";
import type { S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { isValidObjectKey } from "~/utils/isValidObjectKey.js";
import { ObjectStorage } from "./abstractions.js";

// Objects removed at once by `deletePrefix`. One request each: not every S3-compatible service
// takes DeleteObjects.
const DELETE_CONCURRENCY = 10;

const isNotFound = (error: unknown): boolean => {
    const name = (error as { name?: string })?.name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
    return name === "NoSuchKey" || name === "NotFound" || status === 404;
};

const createClient = (storage: FileManagerStandaloneConfig.S3Storage): S3Client => {
    return createS3Client({
        region: storage.region,
        endpoint: storage.endpoint,
        forcePathStyle: storage.forcePathStyle,
        credentials: storage.credentials,
        /*
         * Checksums only where the S3 API requires them. The SDK's default adds them to every
         * upload, and several S3-compatible services reject the extra headers.
         */
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED"
    });
};

class S3ObjectStorageImpl implements ObjectStorage.Interface {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly prefix: string;

    public constructor(config: FileManagerStandaloneConfig.Interface) {
        if (config.storage.type !== "s3") {
            throw new Error(`S3ObjectStorage needs S3 storage, got "${config.storage.type}".`);
        }
        this.client = createClient(config.storage);
        this.bucket = config.storage.bucket;
        this.prefix = config.storage.prefix;
    }

    public async put(key: string, body: Buffer): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: this.toObjectKey(key),
            Body: body
        });
        await this.client.send(command);
    }

    public async putIfAbsent(key: string, body: Buffer): Promise<boolean> {
        /*
         * A check and then a write, not a conditional write (`If-None-Match`): not every
         * S3-compatible service supports one. Two writers racing on one key can both succeed;
         * file keys carry the file's ID, so they don't.
         */
        const exists = await this.exists(key);
        if (exists) {
            return false;
        }
        await this.put(key, body);
        return true;
    }

    public async get(key: string): Promise<Buffer | null> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: this.toObjectKey(key)
        });
        try {
            const result = await this.client.send(command);
            if (!result.Body) {
                return Buffer.alloc(0);
            }
            const bytes = await result.Body.transformToByteArray();
            return Buffer.from(bytes);
        } catch (error) {
            if (isNotFound(error)) {
                return null;
            }
            throw error;
        }
    }

    public async delete(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: this.toObjectKey(key)
        });
        await this.client.send(command);
    }

    public async deletePrefix(prefix: string): Promise<void> {
        if (!prefix.endsWith("/")) {
            throw new Error(`A prefix must end with "/": "${prefix}".`);
        }
        const objectPrefix = this.toObjectKey(prefix.slice(0, -1)) + "/";

        let continuationToken: string | undefined;
        do {
            const listCommand = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: objectPrefix,
                ContinuationToken: continuationToken
            });
            // oxlint-disable-next-line no-await-in-loop -- one page at a time.
            const page = await this.client.send(listCommand);
            const objectKeys = (page.Contents ?? [])
                .map(object => object.Key)
                .filter((objectKey): objectKey is string => !!objectKey);

            // oxlint-disable-next-line no-await-in-loop -- one page at a time.
            await pMap(
                objectKeys,
                async objectKey => {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: this.bucket,
                        Key: objectKey
                    });
                    await this.client.send(deleteCommand);
                },
                { concurrency: DELETE_CONCURRENCY }
            );

            continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
        } while (continuationToken);
    }

    public async createMultipartUpload(key: string): Promise<string> {
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: this.toObjectKey(key)
        });
        const result = await this.client.send(command);
        if (!result.UploadId) {
            throw new Error(`Starting a multipart upload of "${key}" returned no upload ID.`);
        }
        return result.UploadId;
    }

    public async uploadPart(params: ObjectStorage.UploadPartParams): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: this.bucket,
            Key: this.toObjectKey(params.key),
            UploadId: params.uploadId,
            PartNumber: params.partNumber,
            Body: params.body
        });
        const result = await this.client.send(command);
        return result.ETag ?? "";
    }

    public async completeMultipartUpload(key: string, uploadId: string): Promise<void> {
        const objectKey = this.toObjectKey(key);
        const parts: CompletedPart[] = [];

        // The parts as S3 has them: the client only reports that it is done, not their ETags.
        let partNumberMarker: string | undefined;
        do {
            const listCommand = new ListPartsCommand({
                Bucket: this.bucket,
                Key: objectKey,
                UploadId: uploadId,
                PartNumberMarker: partNumberMarker
            });
            // oxlint-disable-next-line no-await-in-loop -- one page at a time.
            const page = await this.client.send(listCommand);
            for (const part of page.Parts ?? []) {
                parts.push({ PartNumber: part.PartNumber, ETag: part.ETag });
            }
            partNumberMarker = page.IsTruncated ? page.NextPartNumberMarker : undefined;
        } while (partNumberMarker);

        if (parts.length === 0) {
            throw new Error(`Multipart upload "${uploadId}" has no parts.`);
        }
        parts.sort((a, b) => (a.PartNumber ?? 0) - (b.PartNumber ?? 0));

        const completeCommand = new CompleteMultipartUploadCommand({
            Bucket: this.bucket,
            Key: objectKey,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts }
        });
        await this.client.send(completeCommand);
    }

    public async abortMultipartUploadsStartedBefore(startedBefore: Date): Promise<number> {
        let aborted = 0;
        let keyMarker: string | undefined;
        let uploadIdMarker: string | undefined;
        do {
            // Only uploads of this project's files, in case the bucket is shared.
            const listCommand = new ListMultipartUploadsCommand({
                Bucket: this.bucket,
                Prefix: `${this.prefix}tenants/`,
                KeyMarker: keyMarker,
                UploadIdMarker: uploadIdMarker
            });
            // oxlint-disable-next-line no-await-in-loop -- one page at a time.
            const page = await this.client.send(listCommand);

            for (const upload of page.Uploads ?? []) {
                if (!upload.Key || !upload.UploadId || !upload.Initiated) {
                    continue;
                }
                if (upload.Initiated.getTime() >= startedBefore.getTime()) {
                    continue;
                }
                const abortCommand = new AbortMultipartUploadCommand({
                    Bucket: this.bucket,
                    Key: upload.Key,
                    UploadId: upload.UploadId
                });
                // oxlint-disable-next-line no-await-in-loop -- few stale uploads at a time.
                await this.client.send(abortCommand);
                aborted++;
            }

            keyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
            uploadIdMarker = page.IsTruncated ? page.NextUploadIdMarker : undefined;
        } while (keyMarker);

        return aborted;
    }

    private async exists(key: string): Promise<boolean> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: this.toObjectKey(key)
        });
        try {
            await this.client.send(command);
            return true;
        } catch (error) {
            if (isNotFound(error)) {
                return false;
            }
            throw error;
        }
    }

    private toObjectKey(key: string): string {
        if (!isValidObjectKey(key)) {
            throw new Error(`Invalid storage key: "${key}".`);
        }
        return `${this.prefix}${key}`;
    }
}

export const S3ObjectStorage = ObjectStorage.createImplementation({
    implementation: S3ObjectStorageImpl,
    dependencies: [FileManagerStandaloneConfig]
});
