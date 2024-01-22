import { ResponseHeaders } from "@webiny/handler";
import { Asset, AssetOutputStrategy, AssetReply } from "~/delivery";

export class SetCacheControlHeaders implements AssetOutputStrategy {
    private readonly strategy: AssetOutputStrategy | undefined;
    private readonly headers: ResponseHeaders;

    constructor(headers: ResponseHeaders, strategy: AssetOutputStrategy | undefined) {
        this.headers = headers;
        this.strategy = strategy;
    }

    async output(asset: Asset): Promise<AssetReply> {
        if (!this.strategy) {
            throw Error(`No asset output strategy is configured!`);
        }

        const reply = await this.strategy.output(asset);

        reply.setHeaders(headers => {
            return headers.merge(this.headers);
        });

        return reply;
    }
}
