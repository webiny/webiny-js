import type { AssetRequestOptions } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequestResolver } from "./abstractions.js";

class FilesAssetRequestResolverImpl implements AssetRequestResolver.Interface {
    async resolve(
        request: AssetRequestResolver.Request
    ): Promise<AssetRequestResolver.AssetRequest | undefined> {
        if (!request.url.startsWith("/files/")) {
            return undefined;
        }

        const params = (request.params as Record<string, any>) ?? {};
        const query = (request.query as Record<string, any>) ?? {};

        const path = params["*"];

        const options: AssetRequestOptions = {
            ...query,
            original: "original" in query
        };

        if (query.width) {
            options.width = parseInt(query.width);
        }

        return new AssetRequest({
            key: decodeURI(path).replace("/files/", ""),
            context: {
                url: request.url
            },
            options
        });
    }
}

export const FilesAssetRequestResolver = AssetRequestResolver.createImplementation({
    implementation: FilesAssetRequestResolverImpl,
    dependencies: []
});
