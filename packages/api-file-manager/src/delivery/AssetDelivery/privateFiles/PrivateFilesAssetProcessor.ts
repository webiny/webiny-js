import { FileManagerContext } from "~/types";
import { Asset, AssetProcessor, AssetRequest } from "~/delivery";
import { AssetAuthorizer } from "~/delivery/AssetDelivery/privateFiles/AssetAuthorizer";
import { NotAuthorizedOutputStrategy } from "~/delivery/AssetDelivery/privateFiles/NotAuthorizedOutputStrategy";
import { internalIdentity } from "./internalIdentity";

export class PrivateFilesAssetProcessor implements AssetProcessor {
    private readonly context: FileManagerContext;
    private assetProcessor: AssetProcessor;
    private assetAuthorizer: AssetAuthorizer;

    constructor(
        context: FileManagerContext,
        assetAuthorizer: AssetAuthorizer,
        assetProcessor: AssetProcessor
    ) {
        this.assetAuthorizer = assetAuthorizer;
        this.context = context;
        this.assetProcessor = assetProcessor;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const id = asset.getId();
        const { security } = this.context;

        const file = await security.withIdentity(internalIdentity, () => {
            return security.withoutAuthorization(() => this.context.fileManager.getFile(id));
        });

        try {
            await this.assetAuthorizer.authorize(file);
        } catch (error) {
            asset.setOutputStrategy(() => new NotAuthorizedOutputStrategy());

            return asset;
        }

        return this.assetProcessor.process(assetRequest, asset);
    }
}
