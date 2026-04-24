import type { Asset } from "@webiny/api-file-manager";
import * as newUtils from "./utils.js";

export class AssetKeyGenerator {
    private utils: typeof newUtils;
    private asset: Asset;

    constructor(asset: Asset) {
        this.asset = asset;
        this.utils = newUtils;
    }

    getOptimizedImageKey() {
        return this.utils.getImageKey({ key: this.asset.getKey() });
    }
    getTransformedImageKey(transformations: Record<string, any>) {
        return this.utils.getImageKey({ key: this.asset.getKey(), transformations });
    }
}
