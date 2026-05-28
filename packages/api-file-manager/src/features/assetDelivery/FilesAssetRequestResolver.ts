import type { Request } from "@webiny/handler/types.js";
import type { AssetRequestOptions } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequestResolver, type IAssetRequestResolver } from "./abstractions.js";

export class FilesAssetRequestResolver implements IAssetRequestResolver {
    async resolve(request: Request): Promise<AssetRequest | undefined> {
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

export const FilesAssetRequestResolverImpl = AssetRequestResolver.createImplementation({
    implementation: FilesAssetRequestResolver,
    dependencies: []
});
