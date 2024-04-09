import { Asset } from "@webiny/api-file-manager";
import * as newUtils from "./utils";
import * as legacyUtils from "./legacyUtils";

export class AssetKeyGenerator {
    private utils: typeof newUtils;
    private asset: Asset;

    constructor(asset: Asset) {
        this.asset = asset;
        this.utils = asset.getKey().includes("/") ? newUtils : legacyUtils;
    }

    getOptimizedImageKey() {
        return this.utils.getImageKey({ key: this.asset.getKey() });
    }
    getTransformedImageKey(transformations: Record<string, any>) {
        return this.utils.getImageKey({ key: this.asset.getKey(), transformations });
    }
}
