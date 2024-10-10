import type { DeleteObjectCommandOutput, S3Client } from "@webiny/aws-sdk/client-s3";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand
} from "@webiny/aws-sdk/client-s3";
import { basename } from "path";
import type {
    IFileFetcher,
    IFileFetcherFetchResult,
    IFileFetcherFile,
    IFileFetcherHeadResult,
    IFileFetcherStream
} from "./abstractions/FileFetcher";

export interface IFileFetcherParams {
    client: S3Client;
    bucket: string;
}

export class FileFetcher implements IFileFetcher {
    public readonly client: S3Client;
    public readonly bucket: string;

    public constructor(params: IFileFetcherParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async head(key: string): Promise<IFileFetcherHeadResult> {
        try {
            const cmd = new HeadObjectCommand({
                Key: key,
                Bucket: this.bucket
            });

            return await this.client.send(cmd);
        } catch (ex) {
            return null;
        }
    }

    public async exists(key: string): Promise<boolean> {
        try {
            const result = await this.head(key);
            if (!result) {
                return false;
            }
            if (!result.$metadata) {
                return false;
            }
            return result.$metadata?.httpStatusCode === 200;
        } catch (ex) {
            return false;
        }
    }

    public async list(key: string): Promise<IFileFetcherFile[]> {
        try {
            const result = await this.client.send(
                new ListObjectsCommand({
                    Bucket: this.bucket,
                    Prefix: key
                })
            );
            if (!Array.isArray(result.Contents)) {
                return [];
            }

            const items: IFileFetcherFile[] = [];
            for (const item of result.Contents) {
                if (!item.Key) {
                    continue;
                }
                items.push({
                    name: basename(item.Key),
                    key: item.Key,
                    /**
                     * TODO: Is it really possible that there is no size of the file???
                     */
                    size: item.Size || 0
                });
            }
            return items.sort((a, b) => a.key.localeCompare(b.key));
        } catch (ex) {
            console.error(ex);
            return [];
        }
    }

    public async fetch(key: string): Promise<IFileFetcherFetchResult> {
        try {
            return await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key
                })
            );
        } catch (ex) {
            console.log(`Could not fetch file "${key}" from bucket "${this.bucket}".`);
            console.error(ex);
            return null;
        }
    }

    public async stream(key: string): Promise<IFileFetcherStream> {
        try {
            const response = await this.fetch(key);
            if (!response) {
                return null;
            }
            /**
             * We can safely cast because we are sure that the response will be readable.
             * The method which is using the fetch() should handle the case when the response is null.
             */
            return (response.Body || null) as IFileFetcherStream;
        } catch (ex) {
            console.log(`Could not fetch file "${key}" from bucket "${this.bucket}".`);
            console.error(ex);
            return null;
        }
    }

    public async read(key: string): Promise<string | null> {
        const response = await this.fetch(key);
        if (!response?.Body) {
            return null;
        }
        try {
            return await response.Body.transformToString();
        } catch (ex) {
            console.log(`Could not read file "${key}" from bucket "${this.bucket}".`);
            console.error(ex);
            return null;
        }
    }

    public async delete(key: string): Promise<DeleteObjectCommandOutput> {
        const cmd = new DeleteObjectCommand({
            Key: key,
            Bucket: this.bucket
        });
        return await this.client.send(cmd);
    }
}
