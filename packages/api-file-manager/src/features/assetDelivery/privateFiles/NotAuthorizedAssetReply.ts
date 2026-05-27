import { ResponseHeaders } from "@webiny/handler";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";

export class NotAuthorizedAssetReply extends AssetReply {
    constructor() {
        super({
            code: 403,
            headers: ResponseHeaders.create({
                "cache-control": "no-store",
                "content-type": "application/json; charset=utf-8"
            }),
            body: () => ({ error: "Not authorized!", code: "NOT_AUTHORIZED" })
        });
    }
}
