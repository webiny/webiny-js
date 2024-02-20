import { Request } from "@webiny/handler/types";
import { AssetRequestResolver } from "./abstractions/AssetRequestResolver";
import { AssetRequest } from "./AssetRequest";

export class FilesAssetRequestResolver implements AssetRequestResolver {
    async resolve(request: Request): Promise<AssetRequest | undefined> {
        // Example: /files/65722cb5c7824a0008d05963/image-48.jpg?width=300
        if (!request.url.startsWith("/files/")) {
            return undefined;
        }

        const params = (request.params as Record<string, any>) ?? {};
        const query = (request.query as Record<string, any>) ?? {};

        // Example: { '*': '/files/65722cb5c7824a0008d05963/image-48.jpg' },
        const path = params["*"];

        return new AssetRequest({
            key: decodeURI(path).replace("/files/", ""),
            context: {
                url: request.url
            },
            options: {
                ...query,
                width: query.width ? parseInt(query.width) : undefined
            }
        });
    }
}
