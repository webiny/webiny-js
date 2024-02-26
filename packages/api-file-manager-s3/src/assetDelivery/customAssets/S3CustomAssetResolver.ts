import path from "path";
import { S3 } from "@webiny/aws-sdk/client-s3";
import { Asset, AssetRequest, AssetResolver } from "@webiny/api-file-manager";
import { S3AssetMetadataReader } from "~/assetDelivery/s3/S3AssetMetadataReader";
import { S3ContentsReader } from "~/assetDelivery/s3/S3ContentsReader";
import { CustomAsset } from "./CustomAsset";

/**
 * This asset resolver kicks in only if the default resolution fails to resolve an asset.
 * The goal of this resolver is to fetch .metadata from the original file that was uploaded via th File Manager.
 */
export class S3CustomAssetResolver implements AssetResolver {
    private readonly s3: S3;
    private readonly bucket: string;
    private assetResolver: AssetResolver;

    constructor(s3: S3, bucket: string, assetResolver: AssetResolver) {
        this.assetResolver = assetResolver;
        this.s3 = s3;
        this.bucket = bucket;
    }

    async resolve(request: AssetRequest): Promise<Asset | undefined> {
        const resolvedAsset = await this.assetResolver.resolve(request);

        if (resolvedAsset) {
            return resolvedAsset;
        }

        try {
            const originalFileMetadataKey = await this.findMetadata(request);

            if (!originalFileMetadataKey) {
                return undefined;
            }

            // We need to fetch the actual size and content type of the file.
            const attrs = await this.getFileAttributes(request.getKey());

            if (!attrs) {
                return undefined;
            }

            const metadataReader = new S3AssetMetadataReader(this.s3, this.bucket);
            const metadata = await metadataReader.getMetadata(
                originalFileMetadataKey.replace(".metadata", "")
            );

            const asset = new CustomAsset({
                // These attributes do not change between the original and derived files.
                id: metadata.id,
                tenant: metadata.tenant,
                locale: metadata.locale,
                // Assign the size and content type of the requested file.
                size: attrs.size,
                contentType: attrs.contentType,
                key: request.getKey()
            });

            asset.setContentsReader(new S3ContentsReader(this.s3, this.bucket));

            return asset;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    // https://d1s78zhy5i2noq.cloudfront.net/files/65a99721c20390000869e3d3/9l9iafhgn-17.jpeg

    private async findMetadata(request: AssetRequest) {
        const requestFolder = path.dirname(request.getKey());

        const assetList = await this.s3.listObjects({
            Bucket: this.bucket,
            Prefix: requestFolder + "/"
        });

        if (!assetList.Contents) {
            return undefined;
        }

        // We assume that there's only one asset with the `.metadata`, and that's the original file.
        const metadata = assetList.Contents.find(file => file.Key?.endsWith(".metadata"));

        return metadata ? metadata.Key : undefined;
    }

    private async getFileAttributes(key: string) {
        const head = await this.s3.headObject({
            Bucket: this.bucket,
            Key: key
        });

        if (!head) {
            return undefined;
        }

        return {
            size: head.ContentLength || 0,
            contentType: head.ContentType || ""
        };
    }
}
