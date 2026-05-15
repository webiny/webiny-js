import {
    createHandlerOnRequest,
    createModifyFastifyPlugin,
    createRoute,
    ResponseHeaders
} from "@webiny/handler";
import { PrivateFilesAssetProcessor } from "./AssetDelivery/privateFiles/PrivateFilesAssetProcessor.js";
import { PrivateAuthenticatedAuthorizer } from "./AssetDelivery/privateFiles/PrivateAuthenticatedAuthorizer.js";
import type { Asset, AssetRequest } from "./index.js";
import {
    AssetDeliveryConfigBuilder,
    AssetDeliveryConfigModifierPlugin
} from "./AssetDelivery/AssetDeliveryConfig.js";
import type { Reply } from "@webiny/handler/types.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy
} from "~/features/assetDelivery/abstractions.js";

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

            // Bridge: apply legacy config modifier plugins (used by api-file-manager-s3).
            // These override the DI registrations from AssetDeliveryFeature.
            // Will be removed once S3 package migrates to DI features (Phase 3).
            const configPlugins = app.webiny.plugins.byType<AssetDeliveryConfigModifierPlugin>(
                AssetDeliveryConfigModifierPlugin.type
            );

            let legacyConfigBuilder: AssetDeliveryConfigBuilder | undefined;

            if (configPlugins.length > 0) {
                legacyConfigBuilder = new AssetDeliveryConfigBuilder();
                configPlugins.forEach(p => p.buildConfig(legacyConfigBuilder!));

                // AssetResolver can be resolved early (only needs container).
                const resolvedAssetResolver = legacyConfigBuilder.getAssetResolver(container);
                container.registerInstance(AssetResolver, resolvedAssetResolver);
            }

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

                        // Resolve output strategy: legacy builder or DI container.
                        const outputStrategy = legacyConfigBuilder
                            ? legacyConfigBuilder.getAssetOutputStrategy(
                                  context,
                                  resolvedRequest,
                                  resolvedAsset
                              )
                            : context.container.resolve(AssetOutputStrategy);

                        resolvedAsset.setOutputStrategy(outputStrategy);

                        // Resolve processor: legacy builder or DI container.
                        let assetProcessor = legacyConfigBuilder
                            ? legacyConfigBuilder.getAssetProcessor(context)
                            : context.container.resolve(AssetProcessor);

                        if (context.wcp.canUsePrivateFiles()) {
                            const assetAuthorizer = new PrivateAuthenticatedAuthorizer(context);
                            assetProcessor = new PrivateFilesAssetProcessor(
                                context,
                                assetAuthorizer,
                                assetProcessor
                            );
                        }

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
