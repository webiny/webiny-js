import { Asset, AssetReply } from "~/delivery";

export interface AssetOutputStrategy {
    output(asset: Asset): Promise<AssetReply>;
}
