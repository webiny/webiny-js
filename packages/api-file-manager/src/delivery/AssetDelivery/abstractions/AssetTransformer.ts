import { ResolvedAsset } from "../ResolvedAsset";

export interface AssetTransformer {
    transform(asset: ResolvedAsset): Promise<ResolvedAsset>;
}
