import type { File } from "~/domain/file/types.js";
import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";
import { NotAuthorizedOutputStrategy } from "./NotAuthorizedOutputStrategy.js";
import { RedirectToPublicUrlOutputStrategy } from "./RedirectToPublicUrlOutputStrategy.js";
import { RedirectToPrivateUrlOutputStrategy } from "./RedirectToPrivateUrlOutputStrategy.js";
import { PrivateCache } from "./PrivateCache.js";
import { PublicCache } from "./PublicCache.js";
import {
    AssetProcessor,
    AssetAuthorizer,
    type IAssetProcessor,
    type IAssetAuthorizer
} from "../abstractions.js";

interface MaybePrivate {
    private?: boolean;
}

export class PrivateFilesAssetProcessor implements IAssetProcessor {
    private readonly identityContext: IdentityContext.Interface;
    private readonly getFile: GetFileUseCase.Interface;
    private readonly assetAuthorizer: IAssetAuthorizer;
    private readonly assetProcessor: IAssetProcessor;

    constructor(
        identityContext: IdentityContext.Interface,
        getFile: GetFileUseCase.Interface,
        assetAuthorizer: IAssetAuthorizer,
        assetProcessor: IAssetProcessor
    ) {
        this.identityContext = identityContext;
        this.getFile = getFile;
        this.assetAuthorizer = assetAuthorizer;
        this.assetProcessor = assetProcessor;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
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

export const PrivateFilesAssetProcessorDecorator = AssetProcessor.createDecorator({
    decorator: PrivateFilesAssetProcessor,
    dependencies: [IdentityContext, GetFileUseCase, AssetAuthorizer]
});
