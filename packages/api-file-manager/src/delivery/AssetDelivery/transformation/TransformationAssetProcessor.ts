import { Asset, AssetProcessor, AssetRequest, AssetTransformationStrategy } from "~/delivery";

export class TransformationAssetProcessor implements AssetProcessor {
    private strategy: AssetTransformationStrategy;

    constructor(strategy: AssetTransformationStrategy) {
        this.strategy = strategy;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const { original } = assetRequest.getOptions();

        // If the `original` image was requested, we skip all transformations.
        if (original) {
            console.log("Skip transformations; original asset was requested.");
            return asset;
        }

        return this.strategy.transform(assetRequest, asset);
    }
}
