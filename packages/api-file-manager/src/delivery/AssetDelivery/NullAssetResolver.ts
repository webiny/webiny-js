import { AssetResolver } from "./abstractions/AssetResolver";
import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";

export class NullAssetResolver implements AssetResolver {
    resolve(): Promise<ResolvedAsset | undefined> {
        return Promise.resolve(undefined);
    }
}
