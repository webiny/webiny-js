import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import {
    AssetProcessor,
    AssetTransformationStrategy,
    type IAssetProcessor,
    type IAssetTransformationStrategy
} from "../abstractions.js";

export class TransformationAssetProcessor implements IAssetProcessor {
    private strategy: IAssetTransformationStrategy;

    constructor(strategy: IAssetTransformationStrategy) {
        this.strategy = strategy;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const { original } = assetRequest.getOptions();

        if (original) {
            console.log("Skip transformations; original asset was requested.");
            return asset;
        }

        return this.strategy.transform(assetRequest, asset);
    }
}

export const TransformationAssetProcessorImpl = AssetProcessor.createImplementation({
    implementation: TransformationAssetProcessor,
    dependencies: [AssetTransformationStrategy]
});
