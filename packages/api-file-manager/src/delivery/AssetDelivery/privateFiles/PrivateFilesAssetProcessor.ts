import { NotFoundError } from "@webiny/handler-graphql";
import { File, FileManagerContext } from "~/types";
import { Asset, AssetProcessor, AssetRequest } from "~/delivery";
import { AssetAuthorizer } from "./AssetAuthorizer";
import { NotAuthorizedOutputStrategy } from "./NotAuthorizedOutputStrategy";
import { RedirectToPublicUrlOutputStrategy } from "./RedirectToPublicUrlOutputStrategy";
import { RedirectToPrivateUrlOutputStrategy } from "./RedirectToPrivateUrlOutputStrategy";
import { PrivateCache } from "./PrivateCache";
import { PublicCache } from "./PublicCache";
import { entryFromStorageTransform } from "@webiny/api-headless-cms";

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

        // Get file from File Manager by `id`.
        const file = await this.getFileById(id);

        const isPrivateFile = this.isPrivate(file);

        if (!isPrivateFile && this.requestedViaPrivateEndpoint(assetRequest)) {
            asset.setOutputStrategy(new RedirectToPublicUrlOutputStrategy(assetRequest));
            return asset;
        }

        if (isPrivateFile && this.requestedViaPublicEndpoint(assetRequest)) {
            asset.setOutputStrategy(new RedirectToPrivateUrlOutputStrategy(assetRequest));
            return asset;
        }

        console.log("file", file);

        try {
            await this.assetAuthorizer.authorize(file);
        } catch (error) {
            asset.setOutputStrategy(new NotAuthorizedOutputStrategy());

            return asset;
        }

        const processedAsset = await this.assetProcessor.process(assetRequest, asset);

        processedAsset.setOutputStrategy(strategy => {
            return isPrivateFile ? new PrivateCache(30, strategy) : new PublicCache(365, strategy);
        });

        return processedAsset;
    }

    /**
     * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     * This method performs a very awkward data loading and type cast which should be removed as soon as we resolve the FLP issue!
     * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     */
    private async getFileById(id: string): Promise<File> {
        const model = await this.context.security.withoutAuthorization(() => {
            return this.context.cms.getModel("fmFile");
        });

        if (!model) {
            throw new NotFoundError("File model not found!");
        }

        const entries = this.context.cms.storageOperations.entries;

        const storageEntry = await entries.getLatestRevisionByEntryId(model, {
            id
        });

        if (!storageEntry) {
            throw new NotFoundError("File not found!");
        }

        const file = await entryFromStorageTransform(this.context, model, storageEntry);

        return file.values as unknown as File;
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
