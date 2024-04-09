import { Asset, AssetReply } from "@webiny/api-file-manager";
import { ResponseHeaders } from "@webiny/handler";

export class S3StreamAssetReply extends AssetReply {
    constructor(asset: Asset) {
        super({
            code: 200,
            headers: ResponseHeaders.create({
                "cache-control": `public, max-age=${86400 * 365}`,
                "content-type": asset.getContentType()
            }),
            body: () => asset.getContents()
        });
    }
}
