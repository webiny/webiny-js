import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { ResponseHeaders } from "@webiny/handler";
import type { IAssetOutputStrategy } from "../abstractions.js";

export class RedirectToPrivateUrlOutputStrategy implements IAssetOutputStrategy {
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
