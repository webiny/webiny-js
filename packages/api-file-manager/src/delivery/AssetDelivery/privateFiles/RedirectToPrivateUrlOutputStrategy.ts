import { Asset, AssetOutputStrategy, AssetReply, AssetRequest } from "~/delivery";
import { ResponseHeaders } from "@webiny/handler";

export class RedirectToPrivateUrlOutputStrategy implements AssetOutputStrategy {
    private assetRequest: AssetRequest;

    constructor(assetRequest: AssetRequest) {
        this.assetRequest = assetRequest;
    }

    async output(asset: Asset): Promise<AssetReply> {
        const requestUrl = this.assetRequest.getContext().url;

        return new AssetReply({
            code: 301,
            headers: ResponseHeaders.create({
                location: requestUrl.replace("/files/", "/private/"),
                "content-type": asset.getContentType(),
                "cache-control": `public, max-age=${86400 * 30}`
            })
        });
    }
}
