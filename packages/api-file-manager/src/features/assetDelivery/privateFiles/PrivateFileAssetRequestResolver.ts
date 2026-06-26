import { AssetRequestResolver } from "../abstractions/AssetRequestResolver.js";
import { AssetRequestFactory } from "../AssetRequest/abstractions.js";

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

        return this.assetRequestFactory.create({
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
    dependencies: [AssetRequestFactory]
});
