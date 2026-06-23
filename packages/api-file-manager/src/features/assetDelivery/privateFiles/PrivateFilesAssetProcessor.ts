import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";
import { NotAuthorizedOutputStrategy } from "./NotAuthorizedOutputStrategy.js";
import { RedirectToPublicUrlOutputStrategy } from "./RedirectToPublicUrlOutputStrategy.js";
import { RedirectToPrivateUrlOutputStrategy } from "./RedirectToPrivateUrlOutputStrategy.js";
import { PrivateCache } from "./PrivateCache.js";
import { PublicCache } from "./PublicCache.js";
import { AssetAuthorizer } from "../abstractions/AssetAuthorizer.js";
import { AssetProcessor } from "../abstractions/AssetProcessor.js";
import type { File as IFile } from "~/domain/file/types.js";

interface MaybePrivate {
    private?: boolean;
}

class PrivateFilesAssetProcessorImpl implements AssetProcessor.Interface {
    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly getFile: GetFileUseCase.Interface,
        private readonly assetAuthorizer: AssetAuthorizer.Interface,
        private readonly assetProcessor: AssetProcessor.Interface
    ) {}

    async process(
        assetRequest: AssetProcessor.AssetRequest,
        asset: AssetProcessor.Asset
    ): Promise<AssetProcessor.Asset> {
        const id = asset.getId();

        const file = await this.identityContext.withoutAuthorization(async () => {
            const fileResult = await this.getFile.execute(id);
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

    private isPrivate(file: IFile) {
        return file.accessControl && file.accessControl.type.startsWith("private-");
    }

    private requestedViaPrivateEndpoint(assetRequest: AssetProcessor.AssetRequest) {
        return assetRequest.getContext<MaybePrivate>().private;
    }

    private requestedViaPublicEndpoint(assetRequest: AssetProcessor.AssetRequest) {
        return !this.requestedViaPrivateEndpoint(assetRequest);
    }
}

export const PrivateFilesAssetProcessor = AssetProcessor.createDecorator({
    decorator: PrivateFilesAssetProcessorImpl,
    dependencies: [IdentityContext, GetFileUseCase, AssetAuthorizer]
});
