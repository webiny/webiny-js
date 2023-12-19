import { Reply } from "@webiny/handler/types";
import { AssetReply } from "@webiny/api-file-manager";

export class S3RedirectAssetReply implements AssetReply {
    private readonly url: string;
    private cacheDuration: number;

    constructor(url: string, cacheDuration: number) {
        this.cacheDuration = cacheDuration;
        this.url = url;
    }

    async reply(reply: Reply): Promise<Reply> {
        return reply
            .code(301)
            .headers({
                Location: this.url,
                "Cache-Control": "public, max-age=" + this.cacheDuration
            })
            .send("");
    }
}
