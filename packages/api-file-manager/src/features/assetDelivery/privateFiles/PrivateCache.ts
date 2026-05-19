import { parse, stringify } from "cache-control-parser";
import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import type { IAssetOutputStrategy } from "../abstractions.js";

export class PrivateCache implements IAssetOutputStrategy {
    private strategy: IAssetOutputStrategy;

    constructor(strategy: IAssetOutputStrategy) {
        this.strategy = strategy;
    }

    async output(asset: Asset): Promise<AssetReply> {
        const reply = await this.strategy.output(asset);

        reply.setHeaders(headers => {
            headers.set("cache-control", (value = "") => {
                const cacheControl = parse(value);
                cacheControl["private"] = true;
                cacheControl["public"] = false;
                return stringify(cacheControl);
            });
            return headers;
        });

        return reply;
    }
}
