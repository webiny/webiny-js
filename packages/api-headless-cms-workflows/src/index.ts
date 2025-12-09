import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { attachStateLifecycleEvents } from "~/state/index.js";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";
import {
    DeleteTargetState,
    DeleteWorkflow,
    GetTargetState,
    ListWorkflows
} from "~/features/EntryWorkflows/abstractions.js";

export const createHeadlessCmsWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.wcp.canUseWorkflows()) {
            return;
        } else if (!context.workflows) {
            return;
        }

        attachStateLifecycleEvents({ context });

        // Register legacy context adapters
        context.container.registerInstance(DeleteTargetState, {
            execute: async (app: string, id: string) => {
                return context.workflowState.deleteTargetState(app, id);
            }
        });

        context.container.registerInstance(GetTargetState, {
            execute: async (app: string, id: string) => {
                return context.workflowState.getTargetState(app, id);
            }
        });

        context.container.registerInstance(DeleteWorkflow, {
            execute: async (app: string, id: string) => {
                return context.workflows.deleteWorkflow(app, id);
            }
        });

        context.container.registerInstance(ListWorkflows, {
            execute: async listParams => {
                return context.workflows.listWorkflows(listParams);
            }
        });

        // Register features
        EntryWorkflowsFeature.register(context.container, context);
    });

    plugin.name = "headless-cms-workflows.context";

    return plugin;
};
