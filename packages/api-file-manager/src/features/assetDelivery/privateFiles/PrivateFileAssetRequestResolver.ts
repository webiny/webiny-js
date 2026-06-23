import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequestResolver } from "../abstractions.js";

class PrivateFileAssetRequestResolverImpl implements AssetRequestResolver.Interface {
    private readonly resolver: AssetRequestResolver.Interface;

    constructor(resolver: AssetRequestResolver.Interface) {
        this.resolver = resolver;
    }

    async resolve(
        request: AssetRequestResolver.Request
    ): Promise<AssetRequestResolver.AssetRequest | undefined> {
        if (!request.url.startsWith("/private/")) {
            return this.resolver.resolve(request);
        }

        const params = (request.params ?? {}) as Record<string, any>;
        const query = (request.query ?? {}) as Record<string, any>;

        const path = params["*"];

        return new AssetRequest({
            key: decodeURI(path).replace("/private/", ""),
            context: {
                url: request.url,
                private: true
            },
            options: {
                ...query,
                width: query.width ? parseInt(query.width) : undefined
            }
        });
    }
}

export const PrivateFileAssetRequestResolver = AssetRequestResolver.createDecorator({
    decorator: PrivateFileAssetRequestResolverImpl,
    dependencies: []
});
