import type { Asset } from "../../../delivery/index.js";
import * as newUtils from "./utils.js";
import type { Framing } from "./utils.js";

export class AssetKeyGenerator {
    private readonly utils: typeof newUtils;
    private readonly asset: Asset;
    private readonly framing?: Framing;

    /**
     * @param framing Effective framing (per-request crop/focal/aspect ratio) used to
     * namespace the cache key, so each distinct framing gets its own derivative. When
     * omitted, falls back to the file's asset-level crop.
     */
    public static create(asset: Asset, framing?: Framing) {
        return new AssetKeyGenerator(asset, framing);
    }

    private constructor(asset: Asset, framing?: Framing) {
        this.asset = asset;
        this.utils = newUtils;
        this.framing = framing;
    }

    private cropSignature() {
        const framing = this.framing ?? { crop: this.asset.getImageEdit()?.crop };
        return this.utils.getFramingSignature(framing);
    }

    public getOptimizedImageKey() {
        return this.utils.getImageKey({
            key: this.asset.getKey(),
            cropSignature: this.cropSignature()
        });
    }

    public getTransformedImageKey(transformations: Record<string, any>) {
        return this.utils.getImageKey({
            key: this.asset.getKey(),
            transformations,
            cropSignature: this.cropSignature()
        });
    }
}
