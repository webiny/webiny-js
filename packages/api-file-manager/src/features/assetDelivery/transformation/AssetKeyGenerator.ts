import type { Asset } from "../../../delivery/index.js";
import * as newUtils from "./utils.js";

export class AssetKeyGenerator {
    private readonly utils: typeof newUtils;
    private readonly asset: Asset;

    public static create(asset: Asset) {
        return new AssetKeyGenerator(asset);
    }

    private constructor(asset: Asset) {
        this.asset = asset;
        this.utils = newUtils;
    }

    public getOptimizedImageKey() {
        return this.utils.getImageKey({ key: this.asset.getKey() });
    }

    public getTransformedImageKey(transformations: Record<string, any>) {
        return this.utils.getImageKey({ key: this.asset.getKey(), transformations });
    }
}
