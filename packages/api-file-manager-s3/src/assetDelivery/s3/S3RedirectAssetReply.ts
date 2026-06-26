import { AssetReply } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { ResponseHeaders } from "@webiny/handler";

export class S3RedirectAssetReply extends AssetReply {
    constructor(url: string, cacheDuration: number) {
        super({
            code: 301,
            headers: ResponseHeaders.create({
                location: url,
                "cache-control": "public, max-age=" + cacheDuration
            }),
            body: () => ""
        });
    }
}
