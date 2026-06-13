import { createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Container } from "@webiny/di";
import { createFileManagerS3 } from "./index.js";
import { createS3AssetDeliveryFeature } from "./assetDelivery/feature.js";
import type { AssetDeliveryParams } from "./assetDelivery/types.js";

export interface FileManagerS3FeatureConfig {
    assetDelivery?: AssetDeliveryParams;
}

export const FileManagerS3Feature = createFeature({
    name: "FileManagerS3",
    register(container: Container, config: FileManagerS3FeatureConfig = {}) {
        // Register S3-specific asset delivery implementations (S3AssetResolver, S3OutputStrategy)
        // These replace the null implementations from AssetDeliveryFeature in FileManagerAppFeature
        createS3AssetDeliveryFeature(config.assetDelivery).register(container);

        const plugins = createFileManagerS3().flat(Infinity as 1);
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
