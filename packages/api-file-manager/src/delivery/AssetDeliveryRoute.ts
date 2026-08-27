import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy
} from "~/features/assetDelivery/abstractions.js";

const NO_CACHE = "no-cache, no-store, must-revalidate";

class AssetDeliveryRouteImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = "/files/*";

    constructor(private container: Container) {}

    async handle(request: HttpRoute.Request, response: HttpRoute.Response) {
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
            return response
                .status(404)
                .header("cache-control", NO_CACHE)
                .json({ error: "Unable to resolve the request!" });
        }

        const resolvedAsset = await assetResolver.resolve(resolvedRequest);
        if (!resolvedAsset) {
            return response
                .status(404)
                .header("cache-control", NO_CACHE)
                .json({ error: "Asset not found!" });
        }

        resolvedAsset.setOutputStrategy(outputStrategy);

        const processedAsset = await assetProcessor.process(resolvedRequest, resolvedAsset);
        const assetReply = await processedAsset.output();

        const rawHeaders = assetReply.getHeaders().getHeaders();
        for (const [k, v] of Object.entries(rawHeaders)) {
            if (v !== undefined) {
                response.header(k, String(v));
            }
        }

        const body = await assetReply.getBody();

        // `end()` (not `send()`) so the raw body passes through untouched and the asset's OWN
        // Content-Type — set from `rawHeaders` above — is preserved. The transport translator
        // (e.g. httpResponseToApiGatewayResult) base64-encodes Buffers and sets isBase64Encoded so
        // API Gateway returns proper binary. Pre-encoding to a base64 STRING here defeated that —
        // the string passed through undecoded and browsers received base64 text, not an image.
        return response.status(assetReply.getCode()).end(body ?? "");
    }
}

export const AssetDeliveryRoute = HttpRoute.createImplementation({
    implementation: AssetDeliveryRouteImpl,
    dependencies: [RequestContainer]
});
