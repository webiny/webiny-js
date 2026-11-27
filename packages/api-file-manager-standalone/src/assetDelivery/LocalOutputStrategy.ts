import {
    AssetOutputStrategy as AssetOutputStrategyAbstraction,
    StreamAssetReply
} from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";

class AssetOutputStrategyImpl implements AssetOutputStrategyAbstraction.Interface {
    private readonly streamAssetReply: StreamAssetReply.Interface;

    constructor(streamAssetReply: StreamAssetReply.Interface) {
        this.streamAssetReply = streamAssetReply;
    }

    async output(
        asset: AssetOutputStrategyAbstraction.Asset
    ): Promise<AssetOutputStrategyAbstraction.AssetReply> {
        return this.streamAssetReply.create(asset);
    }
}

export const LocalOutputStrategy = AssetOutputStrategyAbstraction.createImplementation({
    implementation: AssetOutputStrategyImpl,
    dependencies: [StreamAssetReply]
});
