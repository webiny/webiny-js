import { AssetOutputStrategy, SetCacheControlHeaders } from "~/delivery";
import { ResponseHeaders } from "@webiny/handler";

export class PublicCache extends SetCacheControlHeaders {
    constructor(days: number, strategy: AssetOutputStrategy | undefined) {
        super(
            ResponseHeaders.create({
                "cache-control": `public, max-age=${86400 * days}`
            }),
            strategy
        );
    }
}
