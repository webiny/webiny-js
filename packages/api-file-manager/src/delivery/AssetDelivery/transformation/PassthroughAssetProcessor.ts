import { Asset, AssetProcessor, AssetRequest } from "~/delivery";

export class PassthroughAssetProcessor implements AssetProcessor {
    process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        return Promise.resolve(asset);
    }
}
