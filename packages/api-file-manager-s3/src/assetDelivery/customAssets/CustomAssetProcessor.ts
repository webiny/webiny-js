import { Asset, AssetProcessor, AssetRequest } from "@webiny/api-file-manager";
import { CustomAsset } from "./CustomAsset";

/**
 * We don't want to run any kind of transformations on custom assets.
 * Custom assets are usually pre-processed and ready to be delivered to the client.
 */
export class CustomAssetProcessor implements AssetProcessor {
    private assetProcessor: AssetProcessor;

    constructor(assetProcessor: AssetProcessor) {
        this.assetProcessor = assetProcessor;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        if (asset instanceof CustomAsset) {
            return asset;
        }

        return this.assetProcessor.process(assetRequest, asset);
    }
}
