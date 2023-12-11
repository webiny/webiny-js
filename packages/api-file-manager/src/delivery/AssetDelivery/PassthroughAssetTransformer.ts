import { AssetTransformer } from "./abstractions/AssetTransformer";
import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";

export class PassthroughAssetTransformer implements AssetTransformer {
    transform(asset: ResolvedAsset): Promise<ResolvedAsset> {
        return Promise.resolve(asset);
    }
}
