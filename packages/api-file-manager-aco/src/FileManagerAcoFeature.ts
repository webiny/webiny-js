import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import { createFileManagerAco } from "./index.js";

export const FileManagerAcoFeature = createFeature({
    name: "FileManagerAco",
    register(container: Container) {
        const plugin = createFileManagerAco();
        let initialized = false;

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                if (plugin && typeof (plugin as any).apply === "function") {
                    await (plugin as any).apply(ctx);
                }
            }
        };

        container.registerInstance(GraphQLContextEnhancer, enhancer);
    }
});
