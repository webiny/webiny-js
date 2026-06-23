import type { Asset, AssetOutputStrategy, AssetReply } from "@webiny/api-file-manager";
import { AssetOutputStrategy as AssetOutputStrategyAbstraction } from "@webiny/api-file-manager/features/assetDelivery/abstractions.js";
import { StreamAssetReply } from "@webiny/api-file-manager/features/assetDelivery/StreamAssetReply/index.js";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

export class LocalOutputStrategy implements AssetOutputStrategy {
    private readonly assetStreamingMaxSize: number;
    private readonly streamAssetReply: StreamAssetReply.Interface;

    constructor(config: ILocalAssetDeliveryConfig, streamAssetReply: StreamAssetReply.Interface) {
        this.assetStreamingMaxSize = config.assetStreamingMaxSize;
        this.streamAssetReply = streamAssetReply;
    }

    async output(asset: Asset): Promise<AssetReply> {
        return this.streamAssetReply.create(asset);
    }
}

export const LocalOutputStrategyImpl = AssetOutputStrategyAbstraction.createImplementation({
    implementation: LocalOutputStrategy,
    dependencies: [LocalAssetDeliveryConfig, StreamAssetReply]
});
