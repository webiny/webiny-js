import { AssetRequest, AssetRequestResolver } from "~/delivery";

export class NullRequestResolver implements AssetRequestResolver {
    resolve(): Promise<AssetRequest | undefined> {
        return Promise.resolve(undefined);
    }
}
