import { AssetResolver } from "./abstractions.js";

class NullAssetResolverImpl implements AssetResolver.Interface {
    resolve(): Promise<AssetResolver.Asset | undefined> {
        return Promise.resolve(undefined);
    }
}

export const NullAssetResolver = AssetResolver.createImplementation({
    implementation: NullAssetResolverImpl,
    dependencies: []
});
