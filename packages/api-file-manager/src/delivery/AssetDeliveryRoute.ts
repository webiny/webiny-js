import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy
} from "~/features/assetDelivery/abstractions.js";

const NO_CACHE_HEADERS = {
    "content-type": "application/json",
    "cache-control": "no-cache, no-store, must-revalidate"
};

class AssetDeliveryRouteImpl {
    readonly method = "GET";
    readonly path = "/files/*";

    constructor(private container: Container) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        // Resolve asset-delivery collaborators lazily (request time), not as constructor deps.
        // HttpRouter eagerly constructs every route to match paths, and AssetProcessor's
        // PrivateFilesAssetProcessor decorator pulls in GetFileUseCase -> CMS entry repositories
        // that depend on EntryFromStorageTransform, which is only registered while a CMS GraphQL
        // request is in flight. Resolving here keeps route construction cheap so non-asset
        // requests (e.g. /graphql) don't trigger that chain before it is registered.
        const requestResolver = this.container.resolve(AssetRequestResolver);
        const assetResolver = this.container.resolve(AssetResolver);
        const assetProcessor = this.container.resolve(AssetProcessor);
        const outputStrategy = this.container.resolve(AssetOutputStrategy);

        // Reconstruct a minimal request object compatible with IAssetRequestResolver
        const fakeRequest = {
            url: request.path,
            params: { "*": request.path.replace("/files/", "") },
            query: request.query ?? {},
            headers: request.headers ?? {}
        };

        const resolvedRequest = await requestResolver.resolve(fakeRequest as any);
        if (!resolvedRequest) {
            return {
                statusCode: 404,
                headers: NO_CACHE_HEADERS,
                body: JSON.stringify({ error: "Unable to resolve the request!" })
            };
        }

        const resolvedAsset = await assetResolver.resolve(resolvedRequest);
        if (!resolvedAsset) {
            return {
                statusCode: 404,
                headers: NO_CACHE_HEADERS,
                body: JSON.stringify({ error: "Asset not found!" })
            };
        }

        resolvedAsset.setOutputStrategy(outputStrategy);

        const processedAsset = await assetProcessor.process(resolvedRequest, resolvedAsset);
        const assetReply = await processedAsset.output();

        const rawHeaders = assetReply.getHeaders().getHeaders();
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawHeaders)) {
            if (v !== undefined) {
                headers[k] = String(v);
            }
        }
        headers["x-webiny-base64-encoded"] = "true";

        const body = await assetReply.getBody();
        const statusCode = assetReply.getCode();

        if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
            return {
                statusCode,
                headers,
                body: Buffer.from(body).toString("base64")
            };
        }

        return {
            statusCode,
            headers,
            body: body ?? ""
        };
    }
}

export const AssetDeliveryRoute = HttpRoute.createImplementation({
    implementation: AssetDeliveryRouteImpl,
    dependencies: [RequestContainer]
});
