import { Asset, AssetRequest } from "~/delivery";

export interface AssetResolver {
    resolve(request: AssetRequest): Promise<Asset | undefined>;
}
