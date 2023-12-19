import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { FilesAssetRequestResolver } from "./AssetDelivery/FilesAssetRequestResolver";
import { AliasAssetRequestResolver } from "./AssetDelivery/AliasAssetRequestResolver";
import {
    AssetDeliveryConfigBuilder,
    AssetDeliveryConfigModifierPlugin,
    createAssetDeliveryConfig
} from "~/delivery/AssetDelivery/AssetDeliveryConfig";
import {
    createHandlerOnRequest,
    createModifyFastifyPlugin,
    createRoute,
    ResponseHeaders
} from "@webiny/handler";
import { Asset } from "~/delivery/AssetDelivery/Asset";
import { FileManagerContext } from "~/types";
import { PrivateFilesAssetProcessor } from "~/delivery/AssetDelivery/PrivateFilesAssetProcessor";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest";

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

export interface AssetDeliveryParams {
    documentClient: DynamoDBClient;
}

export const setupAssetDelivery = (params: AssetDeliveryParams) => {
    return [
        createModifyFastifyPlugin(app => {
            // Config builder allows config modification via plugins.
            const configBuilder = new AssetDeliveryConfigBuilder();

            // Apply config modifications.
            const configPlugins = app.webiny.plugins.byType<AssetDeliveryConfigModifierPlugin>(
                AssetDeliveryConfigModifierPlugin.type
            );

            configPlugins.forEach(configPlugin => configPlugin.buildConfig(configBuilder));

            let resolvedRequest: AssetRequest | undefined;
            let resolvedAsset: Asset | undefined;

            // Create a `HandlerOnRequest` plugin to resolve `tenant` and `locale`, and allow the system to bootstrap.
            const handlerOnRequest = createHandlerOnRequest(async (request, reply) => {
                const requestResolver = configBuilder.getAssetRequestResolver();
                resolvedRequest = await requestResolver.resolve(request);

                if (!resolvedRequest) {
                    reply
                        .code(404)
                        .headers(noCacheHeaders.getHeaders())
                        .send({ error: "Unable to resolve the request!" })
                        .hijack();

                    return false;
                }

                const assetResolver = configBuilder.getAssetResolver();

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
                    "x-tenant": resolvedAsset.getTenant(),
                    "x-i18n-locale": resolvedAsset.getLocale()
                };

                return;
            });

            // Create the `Route` plugin, to handle all GET requests, and output the resolved asset.
            const deliveryRoute = createRoute<FileManagerContext>(({ onGet, context }) => {
                onGet(
                    "*",
                    async (_, reply) => {
                        assertAssetRequestWasResolved(resolvedRequest);
                        assertAssetWasResolved(resolvedAsset);

                        let assetProcessor = configBuilder.getAssetProcessor(context);

                        if (context.wcp.canUsePrivateFiles()) {
                            assetProcessor = new PrivateFilesAssetProcessor(
                                context,
                                assetProcessor
                            );
                        }

                        const processedAsset = await assetProcessor.process(
                            resolvedRequest,
                            resolvedAsset
                        );

                        // Determine the output strategy. If strategy is already set, do not override it.
                        processedAsset.setOutputStrategy(strategy => {
                            if (strategy) {
                                return strategy;
                            }

                            assertAssetRequestWasResolved(resolvedRequest);

                            return configBuilder.getAssetOutputStrategy(
                                context,
                                resolvedRequest,
                                processedAsset
                            );
                        });

                        const assetReply = await processedAsset.output();

                        // Set default headers.
                        reply.headers({ "x-webiny-base64-encoded": true });

                        return await assetReply.reply(reply);
                    },
                    { override: true }
                );
            });

            app.webiny.plugins.register(handlerOnRequest, deliveryRoute);
        }),
        // Create the default configuration
        createAssetDeliveryConfig(config => {
            config.decorateRequestResolver(() => {
                // This resolver works with `/files/*` requests.
                return new FilesAssetRequestResolver();
            });

            config.decorateRequestResolver(resolver => {
                // This resolver tries to resolve the request using aliases.
                return new AliasAssetRequestResolver(params.documentClient, resolver);
            });
        })
    ];
};
