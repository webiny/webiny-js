import type { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { NullAssetReply } from "./NullAssetReply.js";
import { AssetOutputStrategy, type IAssetOutputStrategy } from "./abstractions.js";

export class NullAssetOutputStrategy implements IAssetOutputStrategy {
    async output(): Promise<AssetReply> {
        return new NullAssetReply();
    }
}

export const NullAssetOutputStrategyImpl = AssetOutputStrategy.createImplementation({
    implementation: NullAssetOutputStrategy,
    dependencies: []
});
