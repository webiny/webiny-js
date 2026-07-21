import { AssetRequestResolver } from "./abstractions/AssetRequestResolver.js";
import { AssetRequestFactory } from "./AssetRequest/abstractions.js";

class FilesAssetRequestResolverImpl implements AssetRequestResolver.Interface {
    private readonly assetRequestFactory: AssetRequestFactory.Interface;

    constructor(assetRequestFactory: AssetRequestFactory.Interface) {
        this.assetRequestFactory = assetRequestFactory;
    }

    async resolve(
        request: AssetRequestResolver.Request
    ): Promise<AssetRequestResolver.AssetRequest | undefined> {
        if (!request.url.startsWith("/files/")) {
            return undefined;
        }

        const params = (request.params as Record<string, any>) ?? {};
        const query = (request.query as Record<string, any>) ?? {};

        const path = params["*"];

        return this.assetRequestFactory.create({
            key: decodeURI(path).replace("/files/", ""),
            context: {
                url: request.url,
                accept: request.headers?.accept as string | undefined
            },
            options: {
                ...query,
                original: "original" in query
            }
        });
    }
}

export const FilesAssetRequestResolver = AssetRequestResolver.createImplementation({
    implementation: FilesAssetRequestResolverImpl,
    dependencies: [AssetRequestFactory]
});
