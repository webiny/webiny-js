import type { Asset } from "../../../../delivery/index.js";
import type { AssetCrop } from "./imageTypes.js";
import * as newUtils from "./utils.js";

export class AssetKeyGenerator {
    private readonly utils: typeof newUtils;
    private readonly asset: Asset;
    private readonly crop: AssetCrop | undefined;

    public static create(asset: Asset, crop?: AssetCrop) {
        return new AssetKeyGenerator(asset, crop);
    }

    private constructor(asset: Asset, crop?: AssetCrop) {
        this.asset = asset;
        this.crop = crop;
        this.utils = newUtils;
    }

    private signature() {
        return this.utils.getCropSignature(this.crop);
    }

    public getOptimizedImageKey() {
        return this.utils.getImageKey({
            key: this.asset.getKey(),
            cropSignature: this.signature()
        });
    }

    public getTransformedImageKey(transformations: Record<string, any>) {
        return this.utils.getImageKey({
            key: this.asset.getKey(),
            transformations,
            cropSignature: this.signature()
        });
    }
}
