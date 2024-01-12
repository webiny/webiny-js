import { AssetOutputStrategy, AssetReply } from "~/delivery";
import { NullAssetReply } from "./NullAssetReply";

export class NullAssetOutputStrategy implements AssetOutputStrategy {
    async output(): Promise<AssetReply> {
        return new NullAssetReply();
    }
}
