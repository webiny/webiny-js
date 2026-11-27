import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type { Asset, AssetContentsReader } from "@webiny/api-file-manager";
import { toSingleChunk } from "@webiny/api-file-manager";

export class S3ContentsReader implements AssetContentsReader {
    private s3: S3;
    private readonly bucket: string;

    constructor(s3: S3, bucket: string) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    async read(asset: Asset): Promise<Buffer> {
        const { Body } = await this.s3.getObject({
            Bucket: this.bucket,
            Key: asset.getKey()
        });

        if (!Body) {
            throw Error(`Unable to read ${asset.getKey()}!`);
        }

        return Buffer.from(await Body.transformToByteArray());
    }

    /*
     * One chunk: on AWS, `S3OutputStrategy` redirects large files to a presigned URL and API
     * Gateway buffers the response anyway, so there is nothing to gain from streaming here.
     */
    async readStream(asset: Asset): Promise<AsyncIterable<Uint8Array>> {
        const contents = await this.read(asset);
        return toSingleChunk(contents);
    }
}
