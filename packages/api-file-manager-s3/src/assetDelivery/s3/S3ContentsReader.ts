import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type { Asset, AssetContentsReader } from "@webiny/api-file-manager";

export class S3ContentsReader implements AssetContentsReader {
    private readonly s3: S3;
    private readonly bucket: string;

    public static create(s3: S3, bucket: string) {
        return new S3ContentsReader(s3, bucket);
    }

    private constructor(s3: S3, bucket: string) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    public async read(asset: Asset): Promise<Buffer> {
        const { Body } = await this.s3.getObject({
            Bucket: this.bucket,
            Key: asset.getKey()
        });

        if (!Body) {
            throw Error(`Unable to read ${asset.getKey()}!`);
        }

        return Buffer.from(await Body.transformToByteArray());
    }
}
