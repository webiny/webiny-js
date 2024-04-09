import { Asset, AssetRequest } from "~/delivery";

export interface AssetProcessor {
    process(assetRequest: AssetRequest, asset: Asset): Promise<Asset>;
}
