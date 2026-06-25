import {
    createHandlerOnRequest,
    createModifyFastifyPlugin,
    createRoute,
    ResponseHeaders
} from "@webiny/handler";
import type { Asset, AssetRequest } from "./index.js";
import type { Reply } from "@webiny/handler/types.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { AssetRequestResolver } from "~/features/assetDelivery/abstractions/AssetRequestResolver.js";
import { AssetResolver } from "~/features/assetDelivery/abstractions/AssetResolver.js";
import { AssetProcessor } from "~/features/assetDelivery/abstractions/AssetProcessor.js";
import { AssetOutputStrategy } from "~/features/assetDelivery/abstractions/AssetOutputStrategy.js";

const noCacheHeaders = ResponseHeaders.create({
    "content-type": "application/json",
    "cache-control": "no-cache, no-store, must-revalidate"
});

function assertAssetRequestWasResolved(request: any): asserts request is AssetRequest {
    if (request === undefined) {
        throw new Error("Not an AssetRequest!");
    }
}

function assertAssetWasResolved(asset: Asset | undefined): asserts asset is Asset {
    if (asset === undefined) {
        throw new Error("Not an Asset!");
    }
}

export const setupAssetDelivery = () => {
    const outputAsset = async (reply: Reply, asset: Asset) => {
        const assetReply = await asset.output();
        const headers = assetReply.getHeaders();

        headers.set("x-webiny-base64-encoded", "true");

        reply.code(assetReply.getCode());
        reply.headers(headers.getHeaders());
        return reply.send(await assetReply.getBody());
    };

    return [
        createModifyFastifyPlugin(app => {
            const container = app.webiny.container;

            let resolvedRequest: AssetRequest | undefined;
            let resolvedAsset: Asset | undefined;

            const handlerOnRequest = createHandlerOnRequest(async (request, reply) => {
                const requestResolver = container.resolve(AssetRequestResolver);
                resolvedRequest = await requestResolver.resolve(request);

                if (!resolvedRequest) {
                    reply
                        .code(404)
                        .headers(noCacheHeaders.getHeaders())
                        .send({ error: "Unable to resolve the request!" })
                        .hijack();

                    return false;
                }

                const assetResolver = container.resolve(AssetResolver);
                resolvedAsset = await assetResolver.resolve(resolvedRequest);

                if (!resolvedAsset) {
                    reply
                        .code(404)
                        .headers(noCacheHeaders.getHeaders())
                        .send({ error: "Asset not found!" })
                        .hijack();

                    return false;
                }

                request.headers = {
                    ...request.headers,
                    "x-tenant": resolvedAsset.getTenant()
                };

                return;
            });

            const deliveryRoute = createRoute<ApiCoreContext>(({ onGet, context }) => {
                onGet(
                    "*",
                    async (_, reply) => {
                        assertAssetRequestWasResolved(resolvedRequest);
                        assertAssetWasResolved(resolvedAsset);

                        const outputStrategy = context.container.resolve(AssetOutputStrategy);
                        resolvedAsset.setOutputStrategy(outputStrategy);

                        const assetProcessor = context.container.resolve(AssetProcessor);
                        const processedAsset = await assetProcessor.process(
                            resolvedRequest,
                            resolvedAsset
                        );

                        console.log(`Output asset (size: ${processedAsset.getSize()} bytes).`);
                        return outputAsset(reply, processedAsset);
                    },
                    { override: true }
                );
            });

            app.webiny.plugins.register(handlerOnRequest, deliveryRoute);
        })
    ];
};
