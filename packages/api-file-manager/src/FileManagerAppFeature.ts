import { createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Container } from "@webiny/di";
import { createFileManagerContext, createFileManagerGraphQL } from "./index.js";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";
import { AssetDeliveryRoute } from "./delivery/AssetDeliveryRoute.js";
import { FileModel } from "~/domain/file/file.model.js";

export const FileManagerAppFeature = createFeature({
    name: "FileManagerApp",
    register(container: Container) {
        // Register DI abstractions for asset delivery (resolvers, processor, output strategy)
        AssetDeliveryFeature.register(container);

        // Register asset delivery as a proper IHttpRoute (GET /files/*)
        // Replaces the Fastify-based setupAssetDelivery() from the old plugin system
        container.register(AssetDeliveryRoute);

        // Register FileModel as a ModelFactory at register() time so that
        // GetModelUseCase.execute(FILE_MODEL_ID) can find it via ModelBuilderFeature.ModelsProvider
        // during enhance(). If registered only during enhance() (via modelsPlugin), it would
        // arrive too late — fileManagerContextPlugin calls GetModelUseCase before modelsPlugin runs.
        container.register(FileModel);

        const plugins = [...createFileManagerContext(), createFileManagerGraphQL()].flat(
            Infinity as 1
        );

        let initialized = false;

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                for (const plugin of plugins) {
                    if (plugin && typeof (plugin as any).apply === "function") {
                        await (plugin as any).apply(ctx);
                    } else if (ctx.plugins) {
                        ctx.plugins.register(plugin);
                    }
                }
            }
        };

        container.registerInstance(GraphQLContextEnhancer, enhancer);
    }
});
