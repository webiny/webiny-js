import {
    AssetOutputStrategy as AssetOutputStrategyAbstraction,
    StreamAssetReply
} from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

export class LocalOutputStrategy implements AssetOutputStrategyAbstraction.Interface {
    private readonly assetStreamingMaxSize: number;
    private readonly streamAssetReply: StreamAssetReply.Interface;

    constructor(config: ILocalAssetDeliveryConfig, streamAssetReply: StreamAssetReply.Interface) {
        this.assetStreamingMaxSize = config.assetStreamingMaxSize;
        this.streamAssetReply = streamAssetReply;
    }

    async output(
        asset: AssetOutputStrategyAbstraction.Asset
    ): Promise<AssetOutputStrategyAbstraction.AssetReply> {
        return this.streamAssetReply.create(asset);
    }
}

export const LocalOutputStrategyImpl = AssetOutputStrategyAbstraction.createImplementation({
    implementation: LocalOutputStrategy,
    dependencies: [LocalAssetDeliveryConfig, StreamAssetReply]
});
