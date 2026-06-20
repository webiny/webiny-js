import type { Asset, AssetOutputStrategy, AssetReply } from "@webiny/api-file-manager";
import { AssetOutputStrategy as AssetOutputStrategyAbstraction } from "@webiny/api-file-manager/features/assetDelivery/abstractions.js";
import { LocalStreamAssetReply } from "~/assetDelivery/LocalStreamAssetReply.js";
import { LocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";
import type { ILocalAssetDeliveryConfig } from "~/assetDelivery/abstractions.js";

export class LocalOutputStrategy implements AssetOutputStrategy {
    private readonly assetStreamingMaxSize: number;

    constructor(config: ILocalAssetDeliveryConfig) {
        this.assetStreamingMaxSize = config.assetStreamingMaxSize;
    }

    async output(asset: Asset): Promise<AssetReply> {
        if (asset.getSize() > this.assetStreamingMaxSize) {
            console.log(
                `Asset size is greater than ${this.assetStreamingMaxSize}; streaming anyway (local storage has no presigned URL redirect).`
            );
        } else {
            console.log(
                `Asset size is smaller than ${this.assetStreamingMaxSize}; streaming directly.`
            );
        }

        return new LocalStreamAssetReply(asset);
    }
}

export const LocalOutputStrategyImpl = AssetOutputStrategyAbstraction.createImplementation({
    implementation: LocalOutputStrategy,
    dependencies: [LocalAssetDeliveryConfig]
});
