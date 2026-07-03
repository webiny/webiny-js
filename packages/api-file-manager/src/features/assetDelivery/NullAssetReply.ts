import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";

export class NullAssetReply extends AssetReply {
    constructor() {
        super({
            code: 404,
            body: () => ({ error: "Asset output strategy is not implemented!" })
        });
    }
}
