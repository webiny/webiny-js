import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { ImageAssetTypeHandler } from "@webiny/api-file-manager/features/assetDelivery/assetTypes/image/index.js";
import type { IAssetTypeHandler } from "@webiny/api-file-manager/features/assetDelivery/abstractions/AssetType.js";
import type { Asset } from "@webiny/api-file-manager/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "@webiny/api-file-manager/delivery/AssetDelivery/AssetRequest.js";
import { LocalAssetDeliveryConfig, LocalStoragePath } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

/**
 * Defers loading `sharp` until an image is actually transformed. Server counterpart of
 * `api-file-manager-s3`'s `LazySharpTransform`.
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
class LazyLocalSharpTransform implements IAssetTypeHandler {
    private handler: Promise<IAssetTypeHandler> | null = null;

    constructor(
        private readonly storagePath: string,
        private readonly config: ILocalAssetDeliveryConfig,
        private readonly identityContext: IdentityContext.Interface,
        private readonly getFile: GetFileUseCase.Interface
    ) {}

    private resolveHandler(): Promise<IAssetTypeHandler> {
        if (!this.handler) {
            this.handler = import(
                /* webpackChunkName: "localAssetDelivery" */ "./LocalSharpTransform.js"
            ).then(
                ({ LocalSharpTransform }) =>
                    new LocalSharpTransform(
                        this.storagePath,
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

export const LazyLocalSharpTransformImpl = ImageAssetTypeHandler.createImplementation({
    implementation: LazyLocalSharpTransform,
    dependencies: [LocalStoragePath, LocalAssetDeliveryConfig, IdentityContext, GetFileUseCase]
});
