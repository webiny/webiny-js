import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetTransformationStrategy, type IAssetTransformationStrategy } from "../abstractions.js";

export class PassthroughAssetTransformationStrategy implements IAssetTransformationStrategy {
    transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        return Promise.resolve(asset);
    }
}

export const PassthroughAssetTransformationStrategyImpl =
    AssetTransformationStrategy.createImplementation({
        implementation: PassthroughAssetTransformationStrategy,
        dependencies: []
    });
