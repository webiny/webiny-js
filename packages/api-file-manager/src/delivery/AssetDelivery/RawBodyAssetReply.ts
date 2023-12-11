import { RouteHandlerMethod } from "fastify";
import { Reply } from "@webiny/handler/types";
import { AssetReply } from "./abstractions/AssetReply";
import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

export class RawBodyAssetReply implements AssetReply {
    private asset: ResolvedAsset;
    private readonly body: unknown;

    constructor(asset: ResolvedAsset, body: unknown) {
        this.asset = asset;
        this.body = body;
    }

    async reply(reply: Reply): Promise<RouteHandlerMethod> {
        return reply
            .headers({
                "Content-Type": this.asset.getContentType(),
                "Cache-Control": "no-store",
                // "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`,
                "x-webiny-base64-encoded": true
            })
            .send(this.body || "");
    }
}
