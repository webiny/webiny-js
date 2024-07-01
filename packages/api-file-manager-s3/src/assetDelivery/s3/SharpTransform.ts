import sharp from "sharp";
import { S3 } from "@webiny/aws-sdk/client-s3";
import {
    Asset,
    AssetRequest,
    AssetRequestOptions,
    AssetTransformationStrategy
} from "@webiny/api-file-manager";
import { WidthCollection } from "./transformation/WidthCollection";
import * as utils from "./transformation/utils";
import { CallableContentsReader } from "./transformation/CallableContentsReader";
import { AssetKeyGenerator } from "./transformation/AssetKeyGenerator";

interface SharpTransformationParams {
    s3: S3;
    bucket: string;
    imageResizeWidths: number[];
}

export class SharpTransform implements AssetTransformationStrategy {
    private readonly params: SharpTransformationParams;

    constructor(params: SharpTransformationParams) {
        this.params = params;
    }

    async transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        if (!utils.SUPPORTED_TRANSFORMABLE_IMAGES.includes(asset.getExtension())) {
            return asset;
        }

        // `original` is part of the request, but it won't even get to this point in the execution.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { original, ...options } = assetRequest.getOptions();

        const transformedAsset = asset.clone();

        if (Object.keys(options).length > 0) {
            // Transformations were requested.
            return this.transformAsset(transformedAsset, options);
        }

        // Return an optimized asset.
        return this.optimizeAsset(transformedAsset);
    }

    private async transformAsset(asset: Asset, options: Omit<AssetRequestOptions, "original">) {
        if (options.width) {
            const { s3, bucket } = this.params;

            const assetKey = new AssetKeyGenerator(asset);
            const transformedAssetKey = assetKey.getTransformedImageKey(options);

            try {
                const { Body } = await s3.getObject({
                    Bucket: bucket,
                    Key: transformedAssetKey
                });

                if (!Body) {
                    throw new Error(`Missing image body!`);
                }

                const buffer = Buffer.from(await Body.transformToByteArray());

                asset.setContentsReader(new CallableContentsReader(() => buffer));
            } catch (e) {
                const optimizedImage = await this.optimizeAsset(asset);

                const widths = new WidthCollection(this.params.imageResizeWidths);
                const width = widths.getClosestOrMax(options.width);

                /**
                 * `width` is the only transformation we currently support.
                 */
                const buffer = await optimizedImage.getContents();
                const transformedBuffer = sharp(buffer, { animated: this.isAssetAnimated(asset) })
                    .withMetadata()
                    .resize({ width })
                    .toBuffer();

                /**
                 * Transformations are applied to the optimized image.
                 */
                asset.setContentsReader(new CallableContentsReader(() => transformedBuffer));

                await s3.putObject({
                    Bucket: bucket,
                    Key: transformedAssetKey,
                    ContentType: asset.getContentType(),
                    Body: await asset.getContents()
                });
            }
        }

        return asset;
    }

    private async optimizeAsset(asset: Asset) {
        const { s3, bucket } = this.params;

        const assetKey = new AssetKeyGenerator(asset);
        const optimizedAssetKey = assetKey.getOptimizedImageKey();

        try {
            const { Body } = await s3.getObject({
                Bucket: bucket,
                Key: optimizedAssetKey
            });

            if (!Body) {
                throw new Error(`Missing image body!`);
            }

            const buffer = Buffer.from(await Body.transformToByteArray());

            asset.setContentsReader(new CallableContentsReader(() => buffer));
        } catch (e) {
            // If not found, create an optimized version of the original asset.
            const buffer = await asset.getContents();

            const optimizationMap: Record<string, ((buffer: Buffer) => sharp.Sharp) | undefined> = {
                "image/png": (buffer: Buffer) => this.optimizePng(buffer),
                "image/jpeg": (buffer: Buffer) => this.optimizeJpeg(buffer),
                "image/jpg": (buffer: Buffer) => this.optimizeJpeg(buffer)
            };

            const optimization = optimizationMap[asset.getContentType()];

            if (!optimization) {
                console.log(`no optimizations defined for ${asset.getContentType()}`);
                return asset;
            }

            const optimizedBuffer = optimization(buffer).toBuffer();

            asset.setContentsReader(new CallableContentsReader(() => optimizedBuffer));

            await s3.putObject({
                Bucket: bucket,
                Key: optimizedAssetKey,
                ContentType: asset.getContentType(),
                Body: await asset.getContents()
            });
        }

        return asset;
    }

    private isAssetAnimated(asset: Asset) {
        return ["gif", "webp"].includes(asset.getExtension());
    }

    private optimizePng(buffer: Buffer) {
        return sharp(buffer)
            .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
            .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
            .withMetadata();
    }

    private optimizeJpeg(buffer: Buffer) {
        return sharp(buffer)
            .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
            .withMetadata()
            .toFormat("jpeg", { quality: 90 });
    }
}
