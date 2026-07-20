import sharp from "sharp";
import type { Sharp } from "sharp";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type { AssetRequestOptions } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { AssetTransformationStrategy as AssetTransformationStrategyAbstraction } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import {
    contentTypeForFormat,
    DEFAULT_IMAGE_QUALITY,
    type ImageFormat
} from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import {
    cropImageBuffer,
    transformImageBuffer
} from "@webiny/api-file-manager/features/assetDelivery/transformation/transformImage.js";
import type { AssetCrop } from "@webiny/api-file-manager/delivery/AssetDelivery/Asset.js";

const isCropApplied = (crop: AssetCrop | undefined): crop is AssetCrop => {
    return !!crop && !(crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0);
};
import * as utils from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { CallableContentsReader } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { AssetKeyGenerator } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { S3Client, S3Bucket, S3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { IS3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

type TransformOptions = Omit<AssetRequestOptions, "original">;

const hasTransform = (options: TransformOptions): boolean => {
    return (
        options.width !== undefined || options.format !== undefined || options.quality !== undefined
    );
};

export class SharpTransform implements AssetTransformationStrategyAbstraction.Interface {
    private readonly s3: S3;
    private readonly bucket: string;
    private readonly imageResizeWidths: number[];
    private readonly imageQuality: Record<ImageFormat, number>;

    constructor(s3: S3, bucket: string, config: IS3AssetDeliveryConfig) {
        this.s3 = s3;
        this.bucket = bucket;
        this.imageResizeWidths = config.imageResizeWidths;
        this.imageQuality = { ...DEFAULT_IMAGE_QUALITY, ...(config.imageQuality ?? {}) };
    }

    async transform(
        assetRequest: AssetTransformationStrategyAbstraction.AssetRequest,
        asset: AssetTransformationStrategyAbstraction.Asset
    ): Promise<AssetTransformationStrategyAbstraction.Asset> {
        if (!utils.SUPPORTED_TRANSFORMABLE_IMAGES.includes(asset.getExtension())) {
            console.log(
                `Transformations/optimizations of ${asset.getContentType()} assets are not supported. Skipping.`
            );
            return asset;
        }

        // oxlint-disable-next-line typescript/no-unused-vars
        const { original, ...options } = assetRequest.getOptions();

        const transformedAsset = asset.clone();

        if (hasTransform(options)) {
            return this.transformAsset(transformedAsset, options);
        }

        return this.optimizeAsset(transformedAsset);
    }

    private async transformAsset(
        asset: AssetTransformationStrategyAbstraction.Asset,
        options: TransformOptions
    ) {
        const assetKey = AssetKeyGenerator.create(asset);
        const transformedAssetKey = assetKey.getTransformedImageKey(options);

        // Content type is the target format's, or the source format's when only a
        // quality (re-encode) was requested.
        const contentType = options.format
            ? contentTypeForFormat(options.format)
            : asset.getContentType();

        try {
            const { Body } = await this.s3.getObject({
                Bucket: this.bucket,
                Key: transformedAssetKey
            });

            if (!Body) {
                throw new Error(`Missing image body!`);
            }

            const buffer = Buffer.from(await Body.transformToByteArray());

            const newAsset = asset.withProps({ size: buffer.length, contentType });
            newAsset.setContentsReader(CallableContentsReader.create(() => buffer));

            console.log(`Return a previously transformed asset`, {
                key: transformedAssetKey,
                size: newAsset.getSize()
            });

            return newAsset;
        } catch {
            const optimizedImage = await this.optimizeAsset(asset);

            console.log(`Transform the asset`, options);
            const baseBuffer = await optimizedImage.getContents();
            const { buffer: transformedBuffer, contentType: outputContentType } =
                await transformImageBuffer({
                    buffer: baseBuffer,
                    animated: this.isAssetAnimated(asset),
                    sourceContentType: asset.getContentType(),
                    widths: this.imageResizeWidths,
                    options,
                    qualityDefaults: this.imageQuality
                });

            const newAsset = asset.withProps({
                size: transformedBuffer.length,
                contentType: outputContentType
            });
            newAsset.setContentsReader(CallableContentsReader.create(() => transformedBuffer));

            await this.s3.putObject({
                Bucket: this.bucket,
                Key: transformedAssetKey,
                ContentType: newAsset.getContentType(),
                Body: await newAsset.getContents()
            });

            console.log(`Return the transformed asset`, {
                key: transformedAssetKey,
                size: newAsset.getSize(),
                contentType: newAsset.getContentType()
            });

            return newAsset;
        }
    }

    private async optimizeAsset(asset: AssetTransformationStrategyAbstraction.Asset) {
        console.log("Optimize asset", {
            id: asset.getId(),
            key: asset.getKey(),
            size: asset.getSize(),
            type: asset.getContentType()
        });

        const assetKey = AssetKeyGenerator.create(asset);
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
            newAsset.setContentsReader(CallableContentsReader.create(() => buffer));

            return newAsset;
        } catch {
            console.log("Create an optimized version of the original asset", asset.getKey());
            let buffer = await asset.getContents();

            // Bake the asset-level crop first, so both the optimized base and any
            // downstream transforms inherit it.
            const crop = asset.getImageEdit()?.crop;
            const cropped = isCropApplied(crop);
            if (cropped) {
                buffer = await cropImageBuffer(buffer, crop);
            }

            const optimizationMap: Record<string, ((buffer: Buffer) => Sharp) | undefined> = {
                "image/png": (buffer: Buffer) => this.optimizePng(buffer),
                "image/jpeg": (buffer: Buffer) => this.optimizeJpeg(buffer),
                "image/jpg": (buffer: Buffer) => this.optimizeJpeg(buffer)
            };

            const optimization = optimizationMap[asset.getContentType()];

            // Nothing to do (no crop and no optimization for this type) — leave as is.
            if (!optimization && !cropped) {
                console.log(`No optimizations defined for ${asset.getContentType()}`);
                return asset;
            }

            const finalBuffer = optimization ? await optimization(buffer).toBuffer() : buffer;

            console.log("Optimized asset size", finalBuffer.length);

            const newAsset = asset.withProps({ size: finalBuffer.length });
            newAsset.setContentsReader(CallableContentsReader.create(() => finalBuffer));

            await this.s3.putObject({
                Bucket: this.bucket,
                Key: optimizedAssetKey,
                ContentType: newAsset.getContentType(),
                Body: await newAsset.getContents()
            });

            return newAsset;
        }
    }

    private isAssetAnimated(asset: AssetTransformationStrategyAbstraction.Asset) {
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
