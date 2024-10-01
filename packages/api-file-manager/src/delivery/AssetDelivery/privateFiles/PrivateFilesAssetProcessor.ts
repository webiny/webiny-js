import { File, FileManagerContext } from "~/types";
import { Asset, AssetProcessor, AssetRequest } from "~/delivery";
import { AssetAuthorizer } from "./AssetAuthorizer";
import { NotAuthorizedOutputStrategy } from "./NotAuthorizedOutputStrategy";
import { RedirectToPublicUrlOutputStrategy } from "./RedirectToPublicUrlOutputStrategy";
import { RedirectToPrivateUrlOutputStrategy } from "./RedirectToPrivateUrlOutputStrategy";
import { PrivateCache } from "./PrivateCache";
import { PublicCache } from "./PublicCache";

interface MaybePrivate {
    private?: boolean;
}

export class PrivateFilesAssetProcessor implements AssetProcessor {
    private readonly context: FileManagerContext;
    private assetProcessor: AssetProcessor;
    private assetAuthorizer: AssetAuthorizer;

    constructor(
        context: FileManagerContext,
        assetAuthorizer: AssetAuthorizer,
        assetProcessor: AssetProcessor
    ) {
        this.assetAuthorizer = assetAuthorizer;
        this.context = context;
        this.assetProcessor = assetProcessor;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const id = asset.getId();
        const { security, fileManager } = this.context;

        // Get file from File Manager by `id`.
        const file = await security.withoutAuthorization(() => fileManager.getFile(id));

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
        } catch (error) {
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
