import sharp from "sharp";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type {
    Asset,
    AssetRequest,
    AssetRequestOptions,
    AssetTransformationStrategy
} from "@webiny/api-file-manager";
import { AssetTransformationStrategy as AssetTransformationStrategyAbstraction } from "@webiny/api-file-manager/features/assetDelivery/abstractions.js";
import { WidthCollection } from "./transformation/WidthCollection.js";
import * as utils from "./transformation/utils.js";
import { CallableContentsReader } from "./transformation/CallableContentsReader.js";
import { AssetKeyGenerator } from "./transformation/AssetKeyGenerator.js";
import { S3Client, S3Bucket, S3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { IS3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

export class SharpTransform implements AssetTransformationStrategy {
    private readonly s3: S3;
    private readonly bucket: string;
    private readonly imageResizeWidths: number[];

    constructor(s3: S3, bucket: string, config: IS3AssetDeliveryConfig) {
        this.s3 = s3;
        this.bucket = bucket;
        this.imageResizeWidths = config.imageResizeWidths;
    }

    async transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        if (!utils.SUPPORTED_TRANSFORMABLE_IMAGES.includes(asset.getExtension())) {
            console.log(
                `Transformations/optimizations of ${asset.getContentType()} assets are not supported. Skipping.`
            );
            return asset;
        }

        // oxlint-disable-next-line typescript/no-unused-vars
        const { original, ...options } = assetRequest.getOptions();

        const transformedAsset = asset.clone();

        if (Object.keys(options).length > 0) {
            return this.transformAsset(transformedAsset, options);
        }

        return this.optimizeAsset(transformedAsset);
    }

    private async transformAsset(asset: Asset, options: Omit<AssetRequestOptions, "original">) {
        if (options.width) {
            const assetKey = new AssetKeyGenerator(asset);
            const transformedAssetKey = assetKey.getTransformedImageKey(options);

            try {
                const { Body } = await this.s3.getObject({
                    Bucket: this.bucket,
                    Key: transformedAssetKey
                });

                if (!Body) {
                    throw new Error(`Missing image body!`);
                }

                const buffer = Buffer.from(await Body.transformToByteArray());

                const newAsset = asset.withProps({ size: buffer.length });
                newAsset.setContentsReader(new CallableContentsReader(() => buffer));

                console.log(`Return a previously transformed asset`, {
                    key: transformedAssetKey,
                    size: newAsset.getSize()
                });

                return newAsset;
            } catch {
                const optimizedImage = await this.optimizeAsset(asset);

                const widths = new WidthCollection(this.imageResizeWidths);
                const width = widths.getClosestOrMax(options.width);

                console.log(`Resize the asset (width: ${width})`);
                const buffer = await optimizedImage.getContents();
                const transformedBuffer = await sharp(buffer, {
                    animated: this.isAssetAnimated(asset)
                })
                    .withMetadata()
                    .resize({ width, withoutEnlargement: true })
                    .toBuffer();

                const newAsset = asset.withProps({ size: transformedBuffer.length });
                newAsset.setContentsReader(new CallableContentsReader(() => transformedBuffer));

                await this.s3.putObject({
                    Bucket: this.bucket,
                    Key: transformedAssetKey,
                    ContentType: newAsset.getContentType(),
                    Body: await newAsset.getContents()
                });

                console.log(`Return the resized asset`, {
                    key: transformedAssetKey,
                    size: newAsset.getSize()
                });

                return newAsset;
            }
        }

        return asset;
    }

    private async optimizeAsset(asset: Asset) {
        console.log("Optimize asset", {
            id: asset.getId(),
            key: asset.getKey(),
            size: asset.getSize(),
            type: asset.getContentType()
        });

        const assetKey = new AssetKeyGenerator(asset);
        const optimizedAssetKey = assetKey.getOptimizedImageKey();

        try {
            const { Body } = await this.s3.getObject({
                Bucket: this.bucket,
                Key: optimizedAssetKey
            });

            if (!Body) {
                throw new Error(`Missing image body!`);
            }

            console.log("Return a previously optimized asset", optimizedAssetKey);

            const buffer = Buffer.from(await Body.transformToByteArray());

            const newAsset = asset.withProps({ size: buffer.length });
            newAsset.setContentsReader(new CallableContentsReader(() => buffer));

            return newAsset;
        } catch {
            console.log("Create an optimized version of the original asset", asset.getKey());
            const buffer = await asset.getContents();

            const optimizationMap: Record<string, ((buffer: Buffer) => sharp.Sharp) | undefined> = {
                "image/png": (buffer: Buffer) => this.optimizePng(buffer),
                "image/jpeg": (buffer: Buffer) => this.optimizeJpeg(buffer),
                "image/jpg": (buffer: Buffer) => this.optimizeJpeg(buffer)
            };

            const optimization = optimizationMap[asset.getContentType()];

            if (!optimization) {
                console.log(`No optimizations defined for ${asset.getContentType()}`);
                return asset;
            }

            const optimizedBuffer = await optimization(buffer).toBuffer();

            console.log("Optimized asset size", optimizedBuffer.length);

            const newAsset = asset.withProps({ size: optimizedBuffer.length });
            newAsset.setContentsReader(new CallableContentsReader(() => optimizedBuffer));

            await this.s3.putObject({
                Bucket: this.bucket,
                Key: optimizedAssetKey,
                ContentType: newAsset.getContentType(),
                Body: await newAsset.getContents()
            });

            return newAsset;
        }
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

export const SharpTransformImpl = AssetTransformationStrategyAbstraction.createImplementation({
    implementation: SharpTransform,
    dependencies: [S3Client, S3Bucket, S3AssetDeliveryConfig]
});
