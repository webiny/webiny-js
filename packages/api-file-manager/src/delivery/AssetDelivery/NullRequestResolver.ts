import { AssetRequestResolver } from "./abstractions/AssetRequestResolver";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest";

export class NullRequestResolver implements AssetRequestResolver {
    resolve(): Promise<AssetRequest | undefined> {
        return Promise.resolve(undefined);
    }
}
