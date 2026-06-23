import { NullAssetReply } from "./NullAssetReply.js";
import { AssetOutputStrategy } from "./abstractions/AssetOutputStrategy.js";

class NullAssetOutputStrategyImpl implements AssetOutputStrategy.Interface {
    async output(): Promise<AssetOutputStrategy.AssetReply> {
        return new NullAssetReply();
    }
}

export const NullAssetOutputStrategy = AssetOutputStrategy.createImplementation({
    implementation: NullAssetOutputStrategyImpl,
    dependencies: []
});
