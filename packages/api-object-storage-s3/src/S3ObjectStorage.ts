import { Readable } from "node:stream";
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
import { isValidObjectKey } from "@webiny/api-object-storage";
import { ObjectStorage } from "@webiny/api-object-storage";
import { S3StorageConfig } from "./abstractions.js";

/*
 * Objects removed at once by `deletePrefix`. One request each: not every S3-compatible service
 * takes DeleteObjects.
 */
const DELETE_CONCURRENCY = 10;

interface IS3ErrorShape {
    name?: string;
    $metadata?: { httpStatusCode?: number };
}

const toS3Error = (error: unknown): IS3ErrorShape => {
    if (error && typeof error === "object") {
        return error;
    }
    return {};
};

const isNotFound = (error: unknown): boolean => {
    const s3Error = toS3Error(error);
    const status = s3Error.$metadata?.httpStatusCode;
    return s3Error.name === "NoSuchKey" || s3Error.name === "NotFound" || status === 404;
};

/* The key is taken: AWS answers 412, some S3-compatible services 409 while another write runs. */
const isTaken = (error: unknown): boolean => {
    const status = toS3Error(error).$metadata?.httpStatusCode;
    return status === 412 || status === 409;
};

/* The service does not take `If-None-Match` on a write. */
const isConditionalWriteUnsupported = (error: unknown): boolean => {
    const s3Error = toS3Error(error);
    const status = s3Error.$metadata?.httpStatusCode;
    return s3Error.name === "NotImplemented" || status === 501;
};

const createClient = (storage: S3StorageConfig.Interface): S3Client => {
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

    public constructor(config: S3StorageConfig.Interface) {
        this.client = createClient(config);
        this.bucket = config.bucket;
        this.prefix = config.prefix;
    }

    public async put(key: string, body: Buffer): Promise<void> {
        const objectKey = this.toObjectKey(key);
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: body
        });
        await this.client.send(command);
    }

    public async putIfAbsent(key: string, body: Buffer): Promise<boolean> {
        const objectKey = this.toObjectKey(key);
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: body,
            IfNoneMatch: "*"
        });
        try {
            await this.client.send(command);
            return true;
        } catch (error) {
            if (isTaken(error)) {
                return false;
            }
            if (!isConditionalWriteUnsupported(error)) {
                throw error;
            }
        }

        /*
         * A service without conditional writes: a check and then a write. Two writers racing on
         * one key can both succeed there; file keys carry the file's ID, so they don't.
         */
        const exists = await this.exists(objectKey);
        if (exists) {
            return false;
        }
        await this.put(key, body);
        return true;
    }

    public async get(key: string): Promise<Buffer | null> {
        const objectKey = this.toObjectKey(key);
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: objectKey
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

    public async getStream(key: string): Promise<AsyncIterable<Uint8Array> | null> {
        const objectKey = this.toObjectKey(key);
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: objectKey
        });
        let result;
        try {
            result = await this.client.send(command);
        } catch (error) {
            if (isNotFound(error)) {
                return null;
            }
            throw error;
        }

        if (!result.Body) {
            return Readable.from([]);
        }
        /*
         * In Node the SDK hands back the HTTP response itself, a `Readable`. Reading it pulls the
         * object from the service chunk by chunk; ending the iteration early destroys it, which
         * frees the connection.
         */
        if (!(result.Body instanceof Readable)) {
            throw new Error(`GetObject of "${objectKey}" did not return a Node stream.`);
        }
        return result.Body;
    }

    public async delete(key: string): Promise<void> {
        const objectKey = this.toObjectKey(key);
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: objectKey
        });
        await this.client.send(command);
    }

    public async deletePrefix(prefix: string): Promise<void> {
        if (!prefix.endsWith("/")) {
            throw new Error(`A prefix must end with "/": "${prefix}".`);
        }
        const folderKey = prefix.slice(0, -1);
        const objectPrefix = `${this.toObjectKey(folderKey)}/`;

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

            const deleteObject = async (objectKey: string) => {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: objectKey
                });
                await this.client.send(deleteCommand);
            };
            // oxlint-disable-next-line no-await-in-loop -- one page at a time.
            await pMap(objectKeys, deleteObject, { concurrency: DELETE_CONCURRENCY });

            continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
        } while (continuationToken);
    }

    public async hasPrefix(prefix: string): Promise<boolean> {
        if (!prefix.endsWith("/")) {
            throw new Error(`A prefix must end with "/": "${prefix}".`);
        }
        const folderKey = prefix.slice(0, -1);
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: `${this.toObjectKey(folderKey)}/`,
            MaxKeys: 1
        });
        const page = await this.client.send(command);
        return (page.KeyCount ?? 0) > 0;
    }

    public async createMultipartUpload(key: string): Promise<string> {
        const objectKey = this.toObjectKey(key);
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: objectKey
        });
        const result = await this.client.send(command);
        if (!result.UploadId) {
            throw new Error(`Starting a multipart upload of "${key}" returned no upload ID.`);
        }
        return result.UploadId;
    }

    public async uploadPart(params: ObjectStorage.UploadPartParams): Promise<string> {
        const objectKey = this.toObjectKey(params.key);
        const command = new UploadPartCommand({
            Bucket: this.bucket,
            Key: objectKey,
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

    public async abortMultipartUploads(
        params: ObjectStorage.AbortMultipartUploadsParams
    ): Promise<number> {
        const startedBefore = params.startedBefore.getTime();
        let aborted = 0;
        let keyMarker: string | undefined;
        let uploadIdMarker: string | undefined;
        do {
            const listCommand = new ListMultipartUploadsCommand({
                Bucket: this.bucket,
                Prefix: `${this.prefix}${params.prefix}`,
                KeyMarker: keyMarker,
                UploadIdMarker: uploadIdMarker
            });
            // oxlint-disable-next-line no-await-in-loop -- one page at a time.
            const page = await this.client.send(listCommand);

            for (const upload of page.Uploads ?? []) {
                if (!upload.Key || !upload.UploadId || !upload.Initiated) {
                    continue;
                }
                if (upload.Initiated.getTime() >= startedBefore) {
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

    private async exists(objectKey: string): Promise<boolean> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: objectKey
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
    dependencies: [S3StorageConfig]
});
