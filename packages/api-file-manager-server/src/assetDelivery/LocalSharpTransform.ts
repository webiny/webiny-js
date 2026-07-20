import sharp from "sharp";
import type { Sharp } from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import type { AssetRequestOptions } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { AssetTransformationStrategy as AssetTransformationStrategyAbstraction } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import {
    contentTypeForFormat,
    DEFAULT_IMAGE_QUALITY,
    type ImageFormat
} from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { transformImageBuffer } from "@webiny/api-file-manager/features/assetDelivery/transformation/transformImage.js";
import * as utils from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { CallableContentsReader } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { AssetKeyGenerator } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { LocalStoragePath } from "~/assetDelivery/abstractions.js";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

type TransformOptions = Omit<AssetRequestOptions, "original">;

const hasTransform = (options: TransformOptions): boolean => {
    return (
        options.width !== undefined || options.format !== undefined || options.quality !== undefined
    );
};

export class LocalSharpTransform implements AssetTransformationStrategyAbstraction.Interface {
    private readonly storagePath: string;
    private readonly imageResizeWidths: number[];
    private readonly imageQuality: Record<ImageFormat, number>;

    constructor(storagePath: string, config: ILocalAssetDeliveryConfig) {
        this.storagePath = storagePath;
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
        const transformedFilePath = path.join(this.storagePath, transformedAssetKey);

        const contentType = options.format
            ? contentTypeForFormat(options.format)
            : asset.getContentType();

        try {
            const buffer = await fs.readFile(transformedFilePath);

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

            await fs.mkdir(path.dirname(transformedFilePath), { recursive: true });
            await fs.writeFile(transformedFilePath, await newAsset.getContents());

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
        const optimizedFilePath = path.join(this.storagePath, optimizedAssetKey);

        try {
            const buffer = await fs.readFile(optimizedFilePath);

            console.log("Return a previously optimized asset", optimizedAssetKey);

            const newAsset = asset.withProps({ size: buffer.length });
            newAsset.setContentsReader(CallableContentsReader.create(() => buffer));

            return newAsset;
        } catch {
            console.log("Create an optimized version of the original asset", asset.getKey());
            const buffer = await asset.getContents();

            const optimizationMap: Record<string, ((buffer: Buffer) => Sharp) | undefined> = {
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
            newAsset.setContentsReader(CallableContentsReader.create(() => optimizedBuffer));

            await fs.mkdir(path.dirname(optimizedFilePath), { recursive: true });
            await fs.writeFile(optimizedFilePath, await newAsset.getContents());

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

export const LocalSharpTransformImpl = AssetTransformationStrategyAbstraction.createImplementation({
    implementation: LocalSharpTransform,
    dependencies: [LocalStoragePath, LocalAssetDeliveryConfig]
});
