import type { Container } from "@webiny/di";
import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { IAssetProcessor } from "../abstractions.js";
import { AssetType } from "../abstractions/AssetType.js";

export class TransformationAssetProcessor implements IAssetProcessor {
    constructor(private readonly container: Container) {}

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const { original } = assetRequest.getOptions();

        if (original) {
            console.log("Skip transformations; original asset was requested.");
            return asset;
        }

        const assetTypes = this.container.resolveAll(AssetType);
        const match = assetTypes.find(assetType => assetType.canHandle(asset));

        if (!match) {
            return asset;
        }

        try {
            const handler = this.container.resolve(match.getHandlerAbstraction());
            return handler.handle(assetRequest, asset);
        } catch {
            return asset;
        }
    }
}
