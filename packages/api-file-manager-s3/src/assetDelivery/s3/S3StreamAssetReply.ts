import { Reply } from "@webiny/handler/types";
import { Asset, AssetReply } from "@webiny/api-file-manager";

export class S3StreamAssetReply implements AssetReply {
    private asset: Asset;

    constructor(asset: Asset) {
        this.asset = asset;
    }

    async reply(reply: Reply): Promise<Reply> {
        const body = await this.asset.getContents();
        console.log("reply body", body);

        return reply
            .headers({
                "Content-Type": this.asset.getContentType(),
                "Cache-Control": "no-store"
            })
            .send(body);
    }
}
