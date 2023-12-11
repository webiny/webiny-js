import { ResolvedAsset } from "../ResolvedAsset";
import { AssetReply } from "./AssetReply";

export interface AssetOutput {
    output(asset: ResolvedAsset): Promise<AssetReply>;
}
