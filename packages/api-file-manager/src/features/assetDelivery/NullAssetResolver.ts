import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetResolver, type IAssetResolver } from "./abstractions.js";

export class NullAssetResolver implements IAssetResolver {
    resolve(): Promise<Asset | undefined> {
        return Promise.resolve(undefined);
    }
}

export const NullAssetResolverImpl = AssetResolver.createImplementation({
    implementation: NullAssetResolver,
    dependencies: []
});
