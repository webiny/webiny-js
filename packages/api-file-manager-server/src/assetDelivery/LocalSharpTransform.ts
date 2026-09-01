import sharp from "sharp";
import type { Sharp } from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import {
    contentTypeForFormat,
    DEFAULT_IMAGE_QUALITY,
    type ImageFormat
} from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import {
    extractFramedRegion,
    transformImageBuffer
} from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/transformImage.js";
import type {
    AssetImageEdit,
    Framing,
    ImageRequestOptions
} from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/imageTypes.js";
import { normalizeImageOptions } from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/normalizeImageOptions.js";
import { CallableContentsReader } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { AssetKeyGenerator } from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/index.js";
import { ImageAssetTypeHandler } from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/index.js";
import type { IAssetTypeHandler } from "@webiny/api-file-manager/features/assetDelivery/abstractions/AssetType.js";
import type { Asset } from "@webiny/api-file-manager/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "@webiny/api-file-manager/delivery/AssetDelivery/AssetRequest.js";
import { LocalStoragePath } from "~/assetDelivery/abstractions.js";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

type TransformOptions = Omit<ImageRequestOptions, "original" | "crop" | "focal" | "aspectRatio">;

const hasTransform = (options: TransformOptions): boolean => {
    return (
        options.width !== undefined || options.format !== undefined || options.quality !== undefined
    );
};

export class LocalSharpTransform implements IAssetTypeHandler {
    private readonly storagePath: string;
    private readonly imageResizeWidths: number[];
    private readonly imageQuality: Record<ImageFormat, number>;
    private readonly identityContext: IdentityContext.Interface;
    private readonly getFile: GetFileUseCase.Interface;

    constructor(
        storagePath: string,
        config: ILocalAssetDeliveryConfig,
        identityContext: IdentityContext.Interface,
        getFile: GetFileUseCase.Interface
    ) {
        this.storagePath = storagePath;
        this.imageResizeWidths = config.imageResizeWidths;
        this.imageQuality = { ...DEFAULT_IMAGE_QUALITY, ...(config.imageQuality ?? {}) };
        this.identityContext = identityContext;
        this.getFile = getFile;
    }

    async handle(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const rawQuery = assetRequest.getOptions() as Record<string, any>;
        const acceptHeader = assetRequest.getContext<{ accept?: string }>().accept;
        // oxlint-disable-next-line typescript/no-unused-vars
        const { original, crop, focal, aspectRatio, ...options } = normalizeImageOptions(
            rawQuery,
            acceptHeader
        );

        const assetCrop = await this.loadAssetCrop(asset.getId());
        const framing: Framing = {
            crop: crop ?? assetCrop,
            focal,
            aspectRatio
        };

        const transformedAsset = asset.clone();

        if (hasTransform(options)) {
            return this.transformAsset(transformedAsset, options, framing);
        }

        return this.optimizeAsset(transformedAsset, framing);
    }

    private async loadAssetCrop(fileId: string) {
        const result = await this.identityContext.withoutAuthorization(() =>
            this.getFile.execute(fileId)
        );

        if (result.isFail()) {
            return undefined;
        }

        const imageEdit = result.value.metadata?.image as AssetImageEdit | undefined;
        return imageEdit?.crop;
    }

    private async transformAsset(asset: Asset, options: TransformOptions, framing: Framing) {
        const assetKey = AssetKeyGenerator.create(asset, framing);
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
            const optimizedImage = await this.optimizeAsset(asset, framing);

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

    private async optimizeAsset(asset: Asset, framing: Framing) {
        console.log("Optimize asset", {
            id: asset.getId(),
            key: asset.getKey(),
            size: asset.getSize(),
            type: asset.getContentType()
        });

        const assetKey = AssetKeyGenerator.create(asset, framing);
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
            let buffer = await asset.getContents();

            const framed = await extractFramedRegion(buffer, framing);
            const cropped = framed !== buffer;
            buffer = framed;

            const optimizationMap: Record<string, ((buffer: Buffer) => Sharp) | undefined> = {
                "image/png": (buffer: Buffer) => this.optimizePng(buffer),
                "image/jpeg": (buffer: Buffer) => this.optimizeJpeg(buffer),
                "image/jpg": (buffer: Buffer) => this.optimizeJpeg(buffer)
            };

            const optimization = optimizationMap[asset.getContentType()];

            if (!optimization && !cropped) {
                console.log(`No optimizations defined for ${asset.getContentType()}`);
                return asset;
            }

            const finalBuffer = optimization ? await optimization(buffer).toBuffer() : buffer;

            console.log("Optimized asset size", finalBuffer.length);

            const newAsset = asset.withProps({ size: finalBuffer.length });
            newAsset.setContentsReader(CallableContentsReader.create(() => finalBuffer));

            await fs.mkdir(path.dirname(optimizedFilePath), { recursive: true });
            await fs.writeFile(optimizedFilePath, await newAsset.getContents());

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

export const LocalSharpTransformImpl = ImageAssetTypeHandler.createImplementation({
    implementation: LocalSharpTransform,
    dependencies: [LocalStoragePath, LocalAssetDeliveryConfig, IdentityContext, GetFileUseCase]
});
