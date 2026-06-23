import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import type { AssetRequestOptions } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { AssetTransformationStrategy as AssetTransformationStrategyAbstraction } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { WidthCollection } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import * as utils from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { CallableContentsReader } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { AssetKeyGenerator } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { LocalStoragePath } from "~/assetDelivery/abstractions.js";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

export class LocalSharpTransform implements AssetTransformationStrategyAbstraction.Interface {
    private readonly storagePath: string;
    private readonly imageResizeWidths: number[];

    constructor(storagePath: string, config: ILocalAssetDeliveryConfig) {
        this.storagePath = storagePath;
        this.imageResizeWidths = config.imageResizeWidths;
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

        if (Object.keys(options).length > 0) {
            return this.transformAsset(transformedAsset, options);
        }

        return this.optimizeAsset(transformedAsset);
    }

    private async transformAsset(
        asset: AssetTransformationStrategyAbstraction.Asset,
        options: Omit<AssetRequestOptions, "original">
    ) {
        if (options.width) {
            const assetKey = AssetKeyGenerator.create(asset);
            const transformedAssetKey = assetKey.getTransformedImageKey(options);
            const transformedFilePath = path.join(this.storagePath, transformedAssetKey);

            try {
                const buffer = await fs.readFile(transformedFilePath);

                const newAsset = asset.withProps({ size: buffer.length });
                newAsset.setContentsReader(CallableContentsReader.create(() => buffer));

                console.log(`Return a previously transformed asset`, {
                    key: transformedAssetKey,
                    size: newAsset.getSize()
                });

                return newAsset;
            } catch {
                const optimizedImage = await this.optimizeAsset(asset);

                const widths = WidthCollection.create(this.imageResizeWidths);
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
                newAsset.setContentsReader(CallableContentsReader.create(() => transformedBuffer));

                await fs.mkdir(path.dirname(transformedFilePath), { recursive: true });
                await fs.writeFile(transformedFilePath, await newAsset.getContents());

                console.log(`Return the resized asset`, {
                    key: transformedAssetKey,
                    size: newAsset.getSize()
                });

                return newAsset;
            }
        }

        return asset;
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
