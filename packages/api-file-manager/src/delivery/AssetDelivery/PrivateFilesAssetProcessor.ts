import { FileManagerContext } from "~/types";
import { Asset, AssetProcessor, AssetRequest } from "~/delivery";

export class PrivateFilesAssetProcessor implements AssetProcessor {
    private context: FileManagerContext;
    private assetProcessor: AssetProcessor;

    constructor(context: FileManagerContext, assetProcessor: AssetProcessor) {
        this.context = context;
        this.assetProcessor = assetProcessor;
    }

    async process(assetRequest: AssetRequest, asset: Asset): Promise<Asset> {
        const options = assetRequest.getOptions();
        console.log("PRIVATE FILES CHECKS", options);
        // TODO: if allowed, continue with output; if not, return a `NotAuthorizedOutputStrategy`.
        // const id = asset.getId();
        // const file = await this.context.security.withoutAuthorization(() => {
        //     return this.context.fileManager.getFile(id);
        // });
        // console.log(JSON.stringify(file, null, 2));

        if ("private" in options) {
            throw Error(`Not authorized!`);
        }

        return this.assetProcessor.process(assetRequest, asset);
    }
}
