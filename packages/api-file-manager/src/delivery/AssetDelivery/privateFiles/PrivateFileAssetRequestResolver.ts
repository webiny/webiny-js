import { AssetRequest, AssetRequestResolver } from "~/delivery";
import { Request } from "@webiny/handler/types";

export class PrivateFileAssetRequestResolver implements AssetRequestResolver {
    private readonly resolver: AssetRequestResolver;

    constructor(resolver: AssetRequestResolver) {
        this.resolver = resolver;
    }

    async resolve(request: Request): Promise<AssetRequest | undefined> {
        // Example: /private/65722cb5c7824a0008d05963/image-48.jpg?width=300
        if (!request.url.startsWith("/private/")) {
            return this.resolver.resolve(request);
        }

        const params = (request.params ?? {}) as Record<string, any>;
        const query = (request.query ?? {}) as Record<string, any>;

        // Example: { '*': '/private/65722cb5c7824a0008d05963/image-48.jpg' },
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
