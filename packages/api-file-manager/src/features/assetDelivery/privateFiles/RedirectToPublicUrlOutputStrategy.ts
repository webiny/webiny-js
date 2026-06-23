import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { ResponseHeaders } from "@webiny/handler";
import { AssetOutputStrategy } from "../abstractions/AssetOutputStrategy.js";

export class RedirectToPublicUrlOutputStrategy implements AssetOutputStrategy.Interface {
    private readonly assetRequest: AssetRequest;

    public constructor(assetRequest: AssetRequest) {
        this.assetRequest = assetRequest;
    }

    public async output(asset: Asset): Promise<AssetReply> {
        const requestUrl = this.assetRequest.getContext().url;

        return AssetReply.create({
            code: 301,
            headers: ResponseHeaders.create({
                location: requestUrl.replace("/private/", "/files/"),
                "content-type": asset.getContentType(),
                "cache-control": `public, max-age=${86400 * 30}`
            })
        });
    }
}
