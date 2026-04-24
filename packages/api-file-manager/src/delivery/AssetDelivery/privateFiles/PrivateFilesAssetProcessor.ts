import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { File } from "~/domain/file/types.js";
import type { Asset, AssetProcessor, AssetRequest } from "~/delivery/index.js";
import type { AssetAuthorizer } from "./AssetAuthorizer.js";
import { NotAuthorizedOutputStrategy } from "./NotAuthorizedOutputStrategy.js";
import { RedirectToPublicUrlOutputStrategy } from "./RedirectToPublicUrlOutputStrategy.js";
import { RedirectToPrivateUrlOutputStrategy } from "./RedirectToPrivateUrlOutputStrategy.js";
import { PrivateCache } from "./PrivateCache.js";
import { PublicCache } from "./PublicCache.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";

interface MaybePrivate {
    private?: boolean;
}

export class PrivateFilesAssetProcessor implements AssetProcessor {
    private readonly context: ApiCoreContext;
    private assetProcessor: AssetProcessor;
    private assetAuthorizer: AssetAuthorizer;

    constructor(
        context: ApiCoreContext,
        assetAuthorizer: AssetAuthorizer,
        assetProcessor: AssetProcessor
    ) {
        this.assetAuthorizer = assetAuthorizer;
        this.context = context;
        this.assetProcessor = assetProcessor;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const id = asset.getId();
        const { security } = this.context;
        const getFile = this.context.container.resolve(GetFileUseCase);

        // Get file from File Manager by `id`.
        const file = await security.withoutAuthorization(async () => {
            const fileResult = await getFile.execute(id);
            if (fileResult.isFail()) {
                throw fileResult.error;
            }
            return fileResult.value;
        });

        const isPrivateFile = this.isPrivate(file);

        if (!isPrivateFile && this.requestedViaPrivateEndpoint(assetRequest)) {
            asset.setOutputStrategy(new RedirectToPublicUrlOutputStrategy(assetRequest));
            return asset;
        }

        if (isPrivateFile && this.requestedViaPublicEndpoint(assetRequest)) {
            asset.setOutputStrategy(new RedirectToPrivateUrlOutputStrategy(assetRequest));
            return asset;
        }

        try {
            await this.assetAuthorizer.authorize(file);
        } catch {
            asset.setOutputStrategy(new NotAuthorizedOutputStrategy());

            return asset;
        }

        const processedAsset = await this.assetProcessor.process(assetRequest, asset);

        processedAsset.setOutputStrategy(strategy => {
            if (!strategy) {
                throw Error(`No asset output strategy is configured!`);
            }
            return isPrivateFile ? new PrivateCache(strategy) : new PublicCache(strategy);
        });

        return processedAsset;
    }

    private isPrivate(file: File) {
        return file.accessControl && file.accessControl.type.startsWith("private-");
    }

    private requestedViaPrivateEndpoint(assetRequest: AssetRequest) {
        return assetRequest.getContext<MaybePrivate>().private;
    }

    private requestedViaPublicEndpoint(assetRequest: AssetRequest) {
        return !this.requestedViaPrivateEndpoint(assetRequest);
    }
}
