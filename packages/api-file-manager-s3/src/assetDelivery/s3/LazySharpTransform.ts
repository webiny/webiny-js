import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { ImageAssetTypeHandler } from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/index.js";
import type { Asset } from "@webiny/api-file-manager/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "@webiny/api-file-manager/delivery/AssetDelivery/AssetRequest.js";
import { S3AssetDeliveryConfig, S3Bucket, S3Client } from "~/assetDelivery/abstractions.js";
import type { IS3AssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

/**
 * Defers loading `sharp` until an image is actually transformed.
 *
 * The dynamic import is deliberate — it keeps `sharp` out of the main bundle (note the
 * `webpackChunkName`). That import is async and DI resolution is not, which is why this used to be
 * a per-request `RequestContextInitializer` that imported the module and then registered the real
 * handler. `IAssetTypeHandler` has a single async method, so the import can be awaited there
 * instead.
 *
 * The constructed handler IS memoized: the initializer registered it `.inSingletonScope()`, and
 * nothing below caches the instance (Node caches the module, not the object built from it).
 */
class LazySharpTransform implements ImageAssetTypeHandler.Interface {
    private handler: Promise<ImageAssetTypeHandler.Interface> | null = null;

    constructor(
        private readonly s3: S3,
        private readonly bucket: string,
        private readonly config: IS3AssetDeliveryConfig,
        private readonly identityContext: IdentityContext.Interface,
        private readonly getFile: GetFileUseCase.Interface
    ) {}

    private resolveHandler(): Promise<ImageAssetTypeHandler.Interface> {
        if (!this.handler) {
            this.handler = import(
                /* webpackChunkName: "s3AssetDelivery" */ "./SharpTransform.js"
            ).then(
                ({ SharpTransform }) =>
                    new SharpTransform(
                        this.s3,
                        this.bucket,
                        this.config,
                        this.identityContext,
                        this.getFile
                    )
            );
        }
        return this.handler;
    }

    async handle(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        return (await this.resolveHandler()).handle(assetRequest, asset);
    }
}

export const LazySharpTransformImpl = ImageAssetTypeHandler.createImplementation({
    implementation: LazySharpTransform,
    dependencies: [S3Client, S3Bucket, S3AssetDeliveryConfig, IdentityContext, GetFileUseCase]
});
