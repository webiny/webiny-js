import { S3 } from "@webiny/aws-sdk/client-s3";
import { AssetOutput } from "~/delivery/AssetDelivery/abstractions/AssetOutput";
import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply";
import { RawBodyAssetReply } from "~/delivery/AssetDelivery/RawBodyAssetReply";
import { S3ErrorReply } from "./S3ErrorReply";

export class S3AssetOutput implements AssetOutput {
    private readonly s3: S3;
    private readonly bucket: string;

    constructor(s3: S3, bucket: string) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    async output(asset: ResolvedAsset): Promise<AssetReply> {
        try {
            const { Body } = await this.s3.getObject({ Bucket: this.bucket, Key: asset.getKey() });

            if (!Body) {
                return new S3ErrorReply(`Unable to read ${asset.getKey()}!`);
            }

            return new RawBodyAssetReply(asset, Body);
        } catch (error) {
            return new S3ErrorReply(`Unable to output ${asset.getKey()}: ${error.message}`);
        }
    }
}
