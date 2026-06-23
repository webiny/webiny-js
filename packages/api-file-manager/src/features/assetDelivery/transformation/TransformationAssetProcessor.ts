import { AssetProcessor, AssetTransformationStrategy } from "../abstractions.js";

class TransformationAssetProcessorImpl implements AssetProcessor.Interface {
    private strategy: AssetTransformationStrategy.Interface;

    constructor(strategy: AssetTransformationStrategy.Interface) {
        this.strategy = strategy;
    }

    async process(
        assetRequest: AssetProcessor.AssetRequest,
        asset: AssetProcessor.Asset
    ): Promise<AssetProcessor.Asset> {
        const { original } = assetRequest.getOptions();

        if (original) {
            console.log("Skip transformations; original asset was requested.");
            return asset;
        }

        return this.strategy.transform(assetRequest, asset);
    }
}

export const TransformationAssetProcessor = AssetProcessor.createImplementation({
    implementation: TransformationAssetProcessorImpl,
    dependencies: [AssetTransformationStrategy]
});
