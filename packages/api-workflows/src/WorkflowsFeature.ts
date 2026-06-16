import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Plugin } from "@webiny/plugins";
import { createWorkflows } from "./index.js";
import { WorkflowModel } from "./domain/workflow/workflowModel.js";
import { WorkflowStateModel } from "./domain/workflowState/stateModel.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        container.register(WorkflowModel);
        container.register(WorkflowStateModel);

        let initialized = false;

        const contextPlugins: Plugin[] = [...createWorkflows()];

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                for (const plugin of contextPlugins) {
                    if (typeof (plugin as any).apply === "function") {
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
