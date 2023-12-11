import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";
import { AssetRequest } from "../AssetRequest";

export interface AssetResolver {
    resolve(request: AssetRequest): Promise<ResolvedAsset | undefined>;
}
