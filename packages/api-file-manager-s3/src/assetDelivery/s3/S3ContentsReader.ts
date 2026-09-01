import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { AssetContentsReader } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";

export class S3ContentsReader implements AssetContentsReader.Interface {
    private readonly s3: S3;
    private readonly bucket: string;

    public static create(s3: S3, bucket: string) {
        return new S3ContentsReader(s3, bucket);
    }

    private constructor(s3: S3, bucket: string) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    public async read(asset: AssetContentsReader.Asset): Promise<Buffer> {
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
