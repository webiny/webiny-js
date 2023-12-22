import { Reply } from "@webiny/handler/types";
import { Asset, AssetReply } from "@webiny/api-file-manager";

export class S3StreamAssetReply implements AssetReply {
    private asset: Asset;

    constructor(asset: Asset) {
        this.asset = asset;
    }

    async reply(reply: Reply): Promise<Reply> {
        const body = await this.asset.getContents();

        return reply
            .headers({
                "content-type": this.asset.getContentType(),
                "cache-control": "no-store"
            })
            .send(body);
    }
}
