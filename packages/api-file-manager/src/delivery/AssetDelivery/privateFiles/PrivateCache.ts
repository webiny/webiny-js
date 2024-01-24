import { AssetOutputStrategy, SetCacheControlHeaders } from "~/delivery";
import { ResponseHeaders } from "@webiny/handler";

export class PrivateCache extends SetCacheControlHeaders {
    constructor(days: number, strategy: AssetOutputStrategy | undefined) {
        super(
            ResponseHeaders.create({
                "cache-control": `private, max-age=${86400 * days}`
            }),
            strategy
        );
    }
}
