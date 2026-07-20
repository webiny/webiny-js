import type { AssetRequestOptions } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequestResolver } from "../abstractions/AssetRequestResolver.js";
import { AssetRequestFactory } from "../AssetRequest/abstractions.js";
import { normalizeImageOptions } from "../normalizeImageOptions.js";

class PrivateFileAssetRequestResolverImpl implements AssetRequestResolver.Interface {
    private readonly assetRequestFactory: AssetRequestFactory.Interface;
    private readonly resolver: AssetRequestResolver.Interface;

    constructor(
        assetRequestFactory: AssetRequestFactory.Interface,
        resolver: AssetRequestResolver.Interface
    ) {
        this.assetRequestFactory = assetRequestFactory;
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

        const options: AssetRequestOptions = { ...query };
        normalizeImageOptions(options, query, request.headers?.accept as string | undefined);

        return this.assetRequestFactory.create({
            key: decodeURI(path).replace("/private/", ""),
            context: {
                url: request.url,
                private: true
            },
            options
        });
    }
}

export const PrivateFileAssetRequestResolver = AssetRequestResolver.createDecorator({
    decorator: PrivateFileAssetRequestResolverImpl,
    dependencies: [AssetRequestFactory]
});
