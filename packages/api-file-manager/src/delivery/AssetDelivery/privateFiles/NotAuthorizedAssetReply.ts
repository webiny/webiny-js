import { ResponseHeaders } from "@webiny/handler";
import { AssetReply } from "~/delivery";

export class NotAuthorizedAssetReply extends AssetReply {
    constructor() {
        super({
            code: 403,
            headers: ResponseHeaders.create({
                "cache-control": "no-store",
                "content-type": "application/json"
            }),
            body: () => ({ error: "Not authorized!", code: "NOT_AUTHORIZED" })
        });
    }
}
