import type { Asset } from "../../../../delivery/index.js";
import type { Framing } from "./imageTypes.js";
import * as newUtils from "./utils.js";

export class AssetKeyGenerator {
    private readonly utils: typeof newUtils;
    private readonly asset: Asset;
    private readonly framing?: Framing;

    public static create(asset: Asset, framing?: Framing) {
        return new AssetKeyGenerator(asset, framing);
    }

    private constructor(asset: Asset, framing?: Framing) {
        this.asset = asset;
        this.utils = newUtils;
        this.framing = framing;
    }

    private signature() {
        if (this.framing) {
            return this.utils.getFramingSignature(this.framing);
        }
        return undefined;
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
