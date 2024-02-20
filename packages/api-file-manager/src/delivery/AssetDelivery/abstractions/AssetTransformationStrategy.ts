import { Asset, AssetRequest } from "~/delivery";

export interface AssetTransformationStrategy {
    transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset>;
}
