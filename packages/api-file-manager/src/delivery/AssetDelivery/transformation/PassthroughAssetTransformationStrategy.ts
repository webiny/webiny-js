import { Asset, AssetTransformationStrategy, AssetRequest } from "~/delivery";

export class PassthroughAssetTransformationStrategy implements AssetTransformationStrategy {
    transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        return Promise.resolve(asset);
    }
}
