import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import {
    contentTypeForFormat,
    DEFAULT_IMAGE_QUALITY,
    type ImageFormat
} from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
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
import type { SharpTransformer } from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/SharpTransformer.js";
import { ObjectStorage } from "@webiny/api-object-storage";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

type TransformOptions = Omit<ImageRequestOptions, "original" | "crop" | "focal" | "aspectRatio">;

const hasTransform = (options: TransformOptions): boolean => {
    return (
        options.width !== undefined || options.format !== undefined || options.quality !== undefined
    );
};

export class LocalSharpTransform implements IAssetTypeHandler {
    private readonly objectStorage: ObjectStorage.Interface;
    private readonly imageResizeWidths: number[];
    private readonly imageQuality: Record<ImageFormat, number>;
    private readonly identityContext: IdentityContext.Interface;
    private readonly getFile: GetFileUseCase.Interface;
    private readonly logger: Logger.Interface;
    private transformer?: SharpTransformer;

    constructor(
        objectStorage: ObjectStorage.Interface,
        config: ILocalAssetDeliveryConfig,
        identityContext: IdentityContext.Interface,
        getFile: GetFileUseCase.Interface,
        logger: Logger.Interface
    ) {
        this.objectStorage = objectStorage;
        this.imageResizeWidths = config.imageResizeWidths;
        this.imageQuality = { ...DEFAULT_IMAGE_QUALITY, ...(config.imageQuality ?? {}) };
        this.identityContext = identityContext;
        this.getFile = getFile;
        this.logger = logger;
    }

    private async getTransformer(): Promise<SharpTransformer> {
        if (!this.transformer) {
            const { SharpTransformer } =
                await import("@webiny/api-file-manager/features/assetDelivery/assetTypes/image/SharpTransformer.js");
            this.transformer = new SharpTransformer();
        }
        return this.transformer;
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

        const contentType = options.format
            ? contentTypeForFormat(options.format)
            : asset.getContentType();

        const cachedBuffer = await this.objectStorage.get(transformedAssetKey);
        if (cachedBuffer) {
            const newAsset = asset.withProps({ size: cachedBuffer.length, contentType });
            newAsset.setContentsReader(CallableContentsReader.create(() => cachedBuffer));

            this.logger.debug(
                { key: transformedAssetKey, size: newAsset.getSize() },
                "Return a previously transformed asset."
            );

            return newAsset;
        }

        const optimizedImage = await this.optimizeAsset(asset, framing);

        this.logger.debug({ options }, "Transform the asset.");
        const baseBuffer = await optimizedImage.getContents();
        const transformer = await this.getTransformer();
        const { buffer: transformedBuffer, contentType: outputContentType } =
            await transformer.transformBuffer({
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

        const transformedContents = await newAsset.getContents();
        await this.objectStorage.put(transformedAssetKey, transformedContents);

        this.logger.debug(
            {
                key: transformedAssetKey,
                size: newAsset.getSize(),
                contentType: newAsset.getContentType()
            },
            "Return the transformed asset."
        );

        return newAsset;
    }

    private async optimizeAsset(asset: Asset, framing: Framing) {
        this.logger.debug(
            {
                id: asset.getId(),
                key: asset.getKey(),
                size: asset.getSize(),
                type: asset.getContentType()
            },
            "Optimize asset."
        );

        const assetKey = AssetKeyGenerator.create(asset, framing);
        const optimizedAssetKey = assetKey.getOptimizedImageKey();

        const cachedBuffer = await this.objectStorage.get(optimizedAssetKey);
        if (cachedBuffer) {
            this.logger.debug({ key: optimizedAssetKey }, "Return a previously optimized asset.");

            const newAsset = asset.withProps({ size: cachedBuffer.length });
            newAsset.setContentsReader(CallableContentsReader.create(() => cachedBuffer));

            return newAsset;
        }

        const originalKey = asset.getKey();
        this.logger.debug({ key: originalKey }, "Create an optimized version of the asset.");
        let buffer = await asset.getContents();

        const transformer = await this.getTransformer();
        const framed = await transformer.extractFramedRegion(buffer, framing);
        const cropped = framed !== buffer;
        buffer = framed;

        const contentType = asset.getContentType();
        const canOptimize =
            contentType === "image/png" ||
            contentType === "image/jpeg" ||
            contentType === "image/jpg";

        if (!canOptimize && !cropped) {
            this.logger.debug({ contentType }, "No optimizations defined for the content type.");
            return asset;
        }

        let finalBuffer = buffer;
        if (canOptimize) {
            let pipeline;
            if (contentType === "image/png") {
                pipeline = await transformer.optimizePng(buffer);
            } else {
                pipeline = await transformer.optimizeJpeg(buffer);
            }
            finalBuffer = await pipeline.toBuffer();
        }

        this.logger.debug({ size: finalBuffer.length }, "Optimized asset size.");

        const newAsset = asset.withProps({ size: finalBuffer.length });
        newAsset.setContentsReader(CallableContentsReader.create(() => finalBuffer));

        const optimizedContents = await newAsset.getContents();
        await this.objectStorage.put(optimizedAssetKey, optimizedContents);

        return newAsset;
    }

    private isAssetAnimated(asset: Asset) {
        return ["gif", "webp"].includes(asset.getExtension());
    }
}

export const LocalSharpTransformImpl = ImageAssetTypeHandler.createImplementation({
    implementation: LocalSharpTransform,
    dependencies: [ObjectStorage, LocalAssetDeliveryConfig, IdentityContext, GetFileUseCase, Logger]
});
