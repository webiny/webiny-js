import { AssetOutput } from "./abstractions/AssetOutput";
import { AssetReply } from "./abstractions/AssetReply";
import { NullAssetReply } from "./NullAssetReply";

export class NullAssetOutput implements AssetOutput {
    async output(): Promise<AssetReply> {
        return new NullAssetReply();
    }
}
