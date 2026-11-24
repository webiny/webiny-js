import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/kernel-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy
} from "~/features/assetDelivery/abstractions.js";
import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";

const NO_CACHE = "no-cache, no-store, must-revalidate";

class AssetDeliveryRouteImpl implements HttpRouteHandler.Interface {
    constructor(
        private requestResolver: AssetRequestResolver.Interface,
        private assetResolver: AssetResolver.Interface,
        private assetProcessor: AssetProcessor.Interface,
        private outputStrategy: AssetOutputStrategy.Interface,
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface
    ) {}

    async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        // Reconstruct a minimal request object compatible with IAssetRequestResolver. Each resolver
        // strips its own prefix from the path. `url` keeps the query string, so the redirects
        // between `/files/` and `/private/` keep `?width` and `?original`.
        const search = new URLSearchParams(request.query ?? {}).toString();
        const fakeRequest = {
            url: search ? `${request.path}?${search}` : request.path,
            params: { "*": request.path },
            query: request.query ?? {},
            headers: request.headers ?? {}
        };

        const resolvedRequest = await this.requestResolver.resolve(fakeRequest as any);
        if (!resolvedRequest) {
            return response
                .status(404)
                .header("cache-control", NO_CACHE)
                .json({ error: "Unable to resolve the request!" });
        }

        const resolvedAsset = await this.assetResolver.resolve(resolvedRequest);
        if (!resolvedAsset) {
            return response
                .status(404)
                .header("cache-control", NO_CACHE)
                .json({ error: "Asset not found!" });
        }

        // Delivery requests carry no tenant header, so up to this point the request runs in the
        // root tenant. Now that we know which tenant owns the asset, switch to it for the rest of
        // the request, so processors, authorizers and output strategies (e.g. the private files
        // check, which loads the tenant-scoped file entry) all run in the asset's tenant.
        const tenantResult = await this.getTenantById.execute(resolvedAsset.getTenant());
        if (tenantResult.isFail()) {
            return response
                .status(404)
                .header("cache-control", NO_CACHE)
                .json({ error: "Asset not found!" });
        }

        return this.tenantContext.withTenant(tenantResult.value, () =>
            this.deliver(resolvedRequest, resolvedAsset, response)
        );
    }

    private async deliver(
        resolvedRequest: AssetRequest,
        resolvedAsset: Asset,
        response: HttpRouteHandler.Response
    ) {
        resolvedAsset.setOutputStrategy(this.outputStrategy);

        const processedAsset = await this.assetProcessor.process(resolvedRequest, resolvedAsset);
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

export const AssetDeliveryRoute = HttpRouteHandler.createImplementation({
    implementation: AssetDeliveryRouteImpl,
    dependencies: [
        AssetRequestResolver,
        AssetResolver,
        AssetProcessor,
        AssetOutputStrategy,
        TenantContext,
        GetTenantByIdUseCase
    ]
});

class AssetDeliveryRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "asset-delivery";
    readonly method = "GET";
    readonly path = "/files/*";
    readonly handler = AssetDeliveryRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const AssetDeliveryRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: AssetDeliveryRouteDefinitionImpl,
    dependencies: []
});
