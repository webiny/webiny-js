import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy
} from "~/features/assetDelivery/abstractions.js";
import type {
    IAssetRequestResolver,
    IAssetResolver,
    IAssetProcessor,
    IAssetOutputStrategy
} from "~/features/assetDelivery/abstractions.js";

const NO_CACHE_HEADERS = {
    "content-type": "application/json",
    "cache-control": "no-cache, no-store, must-revalidate"
};

class AssetDeliveryRouteImpl {
    readonly method = "GET";
    readonly path = "/files/*";

    constructor(
        private requestResolver: IAssetRequestResolver,
        private assetResolver: IAssetResolver,
        private assetProcessor: IAssetProcessor,
        private outputStrategy: IAssetOutputStrategy
    ) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        // Reconstruct a minimal request object compatible with IAssetRequestResolver
        const fakeRequest = {
            url: request.path,
            params: { "*": request.path.replace("/files/", "") },
            query: request.query ?? {},
            headers: request.headers ?? {}
        };

        const resolvedRequest = await this.requestResolver.resolve(fakeRequest as any);
        if (!resolvedRequest) {
            return {
                statusCode: 404,
                headers: NO_CACHE_HEADERS,
                body: JSON.stringify({ error: "Unable to resolve the request!" })
            };
        }

        const resolvedAsset = await this.assetResolver.resolve(resolvedRequest);
        if (!resolvedAsset) {
            return {
                statusCode: 404,
                headers: NO_CACHE_HEADERS,
                body: JSON.stringify({ error: "Asset not found!" })
            };
        }

        resolvedAsset.setOutputStrategy(this.outputStrategy);

        const processedAsset = await this.assetProcessor.process(resolvedRequest, resolvedAsset);
        const assetReply = await processedAsset.output();

        const headers = assetReply.getHeaders().getHeaders();
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
    dependencies: [AssetRequestResolver, AssetResolver, AssetProcessor, AssetOutputStrategy]
});
