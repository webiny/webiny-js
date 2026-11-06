import type { Request } from "@webiny/handler/types.js";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetRequestResolver, type IAssetRequestResolver } from "../abstractions.js";

export class PrivateFileAssetRequestResolver implements IAssetRequestResolver {
    private readonly resolver: IAssetRequestResolver;

    constructor(resolver: IAssetRequestResolver) {
        this.resolver = resolver;
    }

    async resolve(request: Request): Promise<AssetRequest | undefined> {
        if (!request.url?.startsWith("/private/")) {
            return this.resolver.resolve(request);
        }

        const params = (request.params ?? {}) as Record<string, any>;
        const query = (request.query ?? {}) as Record<string, any>;

        const path = params["*"];

        // A path that is not valid percent-encoding resolves to nothing (404), not a 500.
        let decodedPath: string;
        try {
            decodedPath = decodeURI(path);
        } catch {
            return undefined;
        }

        return new AssetRequest({
            key: decodedPath.replace("/private/", ""),
            context: {
                url: request.url ?? "",
                private: true
            },
            options: {
                ...query,
                width: query.width ? parseInt(query.width) : undefined
            }
        });
    }
}

export const PrivateFileAssetRequestResolverDecorator = AssetRequestResolver.createDecorator({
    decorator: PrivateFileAssetRequestResolver,
    dependencies: []
});
