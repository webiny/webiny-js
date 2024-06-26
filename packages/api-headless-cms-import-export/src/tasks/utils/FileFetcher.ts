import { GetObjectCommand, ListObjectsCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { basename } from "path";
import {
    IFileFetcher,
    IFileFetcherFile,
    IFileFetcherReadable
} from "~/tasks/utils/abstractions/FileFetcher";

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
            return items;
        } catch (ex) {
            console.error(ex);
            return [];
        }
    }

    public async fetch(key: string): Promise<IFileFetcherReadable> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key
                })
            );
            /**
             * We can safely cast because we are sure that the response will be readable.
             * The method which is using the fetch() should handle the case when the response is null.
             */
            return (response.Body || null) as IFileFetcherReadable;
        } catch (ex) {
            console.error(ex);
            return null;
        }
    }
}
