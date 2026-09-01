import type { Container } from "@webiny/di";
import { AssetProcessor } from "../abstractions/AssetProcessor.js";
import { AssetType } from "../abstractions/AssetType.js";

export class TransformationAssetProcessor implements AssetProcessor.Interface {
    constructor(private readonly container: Container) {}

    async process(
        assetRequest: AssetProcessor.AssetRequest,
        asset: AssetProcessor.Asset
    ): Promise<AssetProcessor.Asset> {
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
