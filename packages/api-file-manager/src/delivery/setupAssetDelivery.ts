import { S3 } from "@webiny/aws-sdk/client-s3";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { getEnvironment } from "~/handlers/utils";
import { S3FileMetadataReader } from "./S3FileMetadataReader";
import { FilesAssetRequestResolver } from "./AssetDelivery/FilesAssetRequestResolver";
import { S3AssetOutput, S3AssetResolver } from "./AssetDelivery/s3";
import { AliasAssetRequestResolver } from "./AssetDelivery/AliasAssetRequestResolver";
import {
    AssetDeliveryConfig,
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
import { NullRequestResolver } from "./AssetDelivery/NullRequestResolver";
import { NullAssetResolver } from "./AssetDelivery/NullAssetResolver";
import { PassthroughAssetTransformer } from "./AssetDelivery/PassthroughAssetTransformer";
import { NullAssetOutput } from "./AssetDelivery/NullAssetOutput";
import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";
import { FileManagerContext } from "~/types";
import { resolve } from "~/graphql/utils";

const { bucket, region } = getEnvironment();
const s3 = new S3({ region });

const noCacheHeaders = ResponseHeaders.create({
    "content-type": "application/json",
    "cache-control": "no-cache, no-store, must-revalidate"
});

function assertAssetWasResolved(asset: ResolvedAsset | undefined): asserts asset is ResolvedAsset {
    if (asset === undefined) {
        throw new Error("Not a ResolvedAsset!");
    }
}

export interface AssetDeliveryParams {
    documentClient: DynamoDBClient;
}

export const setupAssetDelivery = (params: AssetDeliveryParams) => {
    return [
        createModifyFastifyPlugin(app => {
            const baseConfig = new AssetDeliveryConfig({
                imageResizeWidths: [],
                assetRequestResolver: new NullRequestResolver(),
                assetResolver: new NullAssetResolver(),
                assetTransformer: new PassthroughAssetTransformer(),
                assetOutput: new NullAssetOutput()
            });

            // Config builder allows config modification via plugins.
            const configBuilder = new AssetDeliveryConfigBuilder(baseConfig);

            // Apply config modifications.
            const configPlugins = app.webiny.plugins.byType<AssetDeliveryConfigModifierPlugin>(
                AssetDeliveryConfigModifierPlugin.type
            );

            configPlugins.forEach(configPlugin => configPlugin.buildConfig(configBuilder));

            let resolvedAsset: ResolvedAsset | undefined;

            // Create a `HandlerOnRequest` plugin to resolve `tenant` and `locale`, and allow the system to bootstrap.
            const handlerOnRequest = createHandlerOnRequest(async (request, reply) => {
                const requestResolver = configBuilder.getAssetRequestResolver();
                const resolvedRequest = await requestResolver.resolve(request);

                console.log("AssetRequest", JSON.stringify(resolvedRequest, null, 2));

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

                console.log("ResolvedAsset", JSON.stringify(resolvedAsset, null, 2));

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
            });

            // Create the `Route` plugin, to handle all GET requests, and output the resolved asset.
            const deliveryRoute = createRoute<FileManagerContext>(({ onGet, context }) => {
                onGet(
                    "*",
                    async (_, reply) => {
                        assertAssetWasResolved(resolvedAsset);
                        const id = resolvedAsset.getId();

                        if (context.wcp.canUsePrivateFiles()) {
                            const file = await context.security.withoutAuthorization(() => {
                                return context.fileManager.getFile(id);
                            });

                            // TODO: check permissions.
                            console.log("file", JSON.stringify(file, null, 2));
                        }

                        // Transform asset
                        const assetTransformer = configBuilder.getAssetTransformer(context);
                        const transformedAsset = new TransformedAsset(resolvedAsset, assetReader);
                        const transformedAsset = await assetTransformer.transform(transformedAsset);

                        // Output asset
                        const assetOutput = configBuilder.getAssetOutput(context);
                        const assetReply = await assetOutput.output(transformedAsset);

                        return assetReply.reply(reply);
                    },
                    { override: true }
                );
            });

            app.webiny.plugins.register(handlerOnRequest, deliveryRoute);
        }),
        // Create the default configuration
        createAssetDeliveryConfig(config => {
            config.setImageResizeWidths(() => [100, 300, 500, 750, 1000, 1500, 2500]);

            config.decorateRequestResolver(() => {
                // This resolver works with `/files/*` requests.
                return new FilesAssetRequestResolver();
            });

            config.decorateRequestResolver(resolver => {
                // This resolver tries to resolve the request using aliases.
                return new AliasAssetRequestResolver(params.documentClient, resolver);
            });

            config.decorateAssetResolver(() => {
                // This resolver loads file information from the `.metadata` file.
                return new S3AssetResolver(new S3FileMetadataReader(s3, bucket));
            });

            config.decorateAssetOutput(() => {
                return new S3AssetOutput(s3, bucket);
            });

            config.decorateAssetTransformer(() => {
                return new SharpTransformer();
            })
        })
    ];
};
