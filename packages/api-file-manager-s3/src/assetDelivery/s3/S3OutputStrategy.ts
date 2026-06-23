import type { Asset, AssetOutputStrategy, AssetReply } from "@webiny/api-file-manager";
import { AssetOutputStrategy as AssetOutputStrategyAbstraction } from "@webiny/api-file-manager/features/assetDelivery/abstractions.js";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { GetObjectCommand, getSignedUrl } from "@webiny/aws-sdk/client-s3/index.js";
import { StreamAssetReply } from "@webiny/api-file-manager/features/assetDelivery/StreamAssetReply/index.js";
import { S3RedirectAssetReply } from "~/assetDelivery/s3/S3RedirectAssetReply.js";
import { S3Client, S3Bucket, S3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { IS3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

export class S3OutputStrategy implements AssetOutputStrategy {
    private readonly s3: S3;
    private readonly bucket: string;
    private readonly presignedUrlTtl: number;
    private readonly assetStreamingMaxSize: number;
    private readonly streamAssetReply: StreamAssetReply.Interface;

    constructor(
        s3: S3,
        bucket: string,
        config: IS3AssetDeliveryConfig,
        streamAssetReply: StreamAssetReply.Interface
    ) {
        this.s3 = s3;
        this.bucket = bucket;
        this.presignedUrlTtl = config.presignedUrlTtl;
        this.assetStreamingMaxSize = config.assetStreamingMaxSize;
        this.streamAssetReply = streamAssetReply;
    }

    async output(asset: Asset): Promise<AssetReply> {
        if (asset.getSize() > this.assetStreamingMaxSize) {
            console.log(
                `Asset size is greater than ${this.assetStreamingMaxSize}; redirecting to a presigned S3 URL.`
            );

            return new S3RedirectAssetReply(
                await this.getPresignedUrl(asset),
                this.presignedUrlTtl
            );
        }

        console.log(
            `Asset size is smaller than ${this.assetStreamingMaxSize}; streaming directly from Lambda function.`
        );
        return this.streamAssetReply.create(asset);
    }

    protected getPresignedUrl(asset: Asset) {
        return getSignedUrl(
            this.s3,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: asset.getKey()
            }),
            { expiresIn: this.presignedUrlTtl }
        );
    }
}

export const S3OutputStrategyImpl = AssetOutputStrategyAbstraction.createImplementation({
    implementation: S3OutputStrategy,
    dependencies: [S3Client, S3Bucket, S3AssetDeliveryConfig, StreamAssetReply]
});
