import { AssetTransformationStrategy } from "../abstractions/AssetTransformationStrategy.js";

class PassthroughAssetTransformationStrategyImpl implements AssetTransformationStrategy.Interface {
    transform(
        assetRequest: AssetTransformationStrategy.AssetRequest,
        asset: AssetTransformationStrategy.Asset
    ): Promise<AssetTransformationStrategy.Asset> {
        return Promise.resolve(asset);
    }
}

export const PassthroughAssetTransformationStrategy =
    AssetTransformationStrategy.createImplementation({
        implementation: PassthroughAssetTransformationStrategyImpl,
        dependencies: []
    });
