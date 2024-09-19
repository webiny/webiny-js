import { Asset, AssetOutputStrategy, AssetReply } from "@webiny/api-file-manager";
import { GetObjectCommand, getSignedUrl, S3 } from "@webiny/aws-sdk/client-s3";
import { S3RedirectAssetReply } from "~/assetDelivery/s3/S3RedirectAssetReply";
import { S3StreamAssetReply } from "~/assetDelivery/s3/S3StreamAssetReply";

/**
 * This strategy outputs an asset taking into account the size of the asset contents.
 * If the asset is larger than 5MB, a presigned URL will be generated, and a redirect will happen.
 */
export class S3OutputStrategy implements AssetOutputStrategy {
    private readonly s3: S3;
    private readonly bucket: string;
    private readonly presignedUrlTtl: number;
    private readonly assetStreamingMaxSize: number;

    constructor(s3: S3, bucket: string, presignedUrlTtl: number, assetStreamingMaxSize: number) {
        this.assetStreamingMaxSize = assetStreamingMaxSize;
        this.presignedUrlTtl = presignedUrlTtl;
        this.s3 = s3;
        this.bucket = bucket;
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
        return new S3StreamAssetReply(asset);
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
