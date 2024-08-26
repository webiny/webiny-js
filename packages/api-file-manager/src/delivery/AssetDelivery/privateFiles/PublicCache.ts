import { parse, stringify } from "cache-control-parser";
import { Asset, AssetOutputStrategy, AssetReply } from "~/delivery";

export class PublicCache implements AssetOutputStrategy {
    private strategy: AssetOutputStrategy;

    constructor(strategy: AssetOutputStrategy) {
        this.strategy = strategy;
    }

    async output(asset: Asset): Promise<AssetReply> {
        const reply = await this.strategy.output(asset);

        reply.setHeaders(headers => {
            headers.set("cache-control", (value = "") => {
                const cacheControl = parse(value);
                cacheControl["private"] = false;
                cacheControl["public"] = true;
                return stringify(cacheControl);
            });
            return headers;
        });

        return reply;
    }
}
