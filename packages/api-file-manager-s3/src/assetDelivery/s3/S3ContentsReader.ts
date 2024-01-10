import { S3 } from "@webiny/aws-sdk/client-s3";
import { Asset, AssetContentsReader } from "@webiny/api-file-manager";

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
}
