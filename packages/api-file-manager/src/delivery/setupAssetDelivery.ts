import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import {
    createHandlerOnRequest,
    createModifyFastifyPlugin,
    createRoute,
    ResponseHeaders
} from "@webiny/handler";
import { FileManagerContext } from "~/types";
import { PrivateFilesAssetProcessor } from "./AssetDelivery/privateFiles/PrivateFilesAssetProcessor";
import { PrivateAuthenticatedAuthorizer } from "./AssetDelivery/privateFiles/PrivateAuthenticatedAuthorizer";
import { PrivateFileAssetRequestResolver } from "./AssetDelivery/privateFiles/PrivateFileAssetRequestResolver";
import {
    Asset,
    AssetDeliveryConfigBuilder,
    AssetDeliveryConfigModifierPlugin,
    AssetRequest,
    AliasAssetRequestResolver,
    FilesAssetRequestResolver,
    createAssetDeliveryConfig
} from "./index";
import { Reply } from "@webiny/handler/types";

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
    documentClient: DynamoDBDocument;
}

export const setupAssetDelivery = (params: AssetDeliveryParams) => {
    const outputAsset = async (reply: Reply, asset: Asset) => {
        const assetReply = await asset.output();
        const headers = assetReply.getHeaders();

        // Set default headers.
        headers.set("x-webiny-base64-encoded", true);

        reply.code(assetReply.getCode());
        reply.headers(headers.getHeaders());
        return reply.send(await assetReply.getBody());
    };

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

                const assetLocale = resolvedAsset.getLocale();

                request.headers = {
                    ...request.headers,
                    "x-tenant": resolvedAsset.getTenant(),
                    "x-i18n-locale": `default:${assetLocale};content:${assetLocale};`
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

                        if (context.wcp.canUsePrivateFiles()) {
                            configBuilder.decorateAssetProcessor(({ assetProcessor, context }) => {
                                // Currently, we only have one authorizer.
                                const assetAuthorizer = new PrivateAuthenticatedAuthorizer(context);

                                return new PrivateFilesAssetProcessor(
                                    context,
                                    assetAuthorizer,
                                    assetProcessor
                                );
                            });
                        }

                        const outputStrategy = configBuilder.getAssetOutputStrategy(
                            context,
                            resolvedRequest,
                            resolvedAsset
                        );

                        resolvedAsset.setOutputStrategy(outputStrategy);

                        const assetProcessor = configBuilder.getAssetProcessor(context);

                        const processedAsset = await assetProcessor.process(
                            resolvedRequest,
                            resolvedAsset
                        );

                        // Get reply object (runs the output strategy under the hood).
                        console.log(`Output asset (size: ${processedAsset.getSize()} bytes).`);
                        return outputAsset(reply, processedAsset);
                    },
                    { override: true }
                );
            });

            app.webiny.plugins.register(handlerOnRequest, deliveryRoute);
        }),
        // Create the default configuration
        createAssetDeliveryConfig(config => {
            config.decorateAssetRequestResolver(() => {
                // This resolver works with `/files/*` requests.
                return new FilesAssetRequestResolver();
            });

            config.decorateAssetRequestResolver(({ assetRequestResolver }) => {
                // This resolver tries to resolve the request using aliases.
                return new AliasAssetRequestResolver(params.documentClient, assetRequestResolver);
            });

            config.decorateAssetRequestResolver(({ assetRequestResolver }) => {
                // This resolver works with `/private/*` requests.
                return new PrivateFileAssetRequestResolver(assetRequestResolver);
            });
        })
    ];
};
