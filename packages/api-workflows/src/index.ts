import { createSchema } from "~/graphql/schema.js";
import { createContext } from "~/context/index.js";
import { createWorkflowModel } from "~/context/model.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";

export const createWorkflows = () => {
    return new ContextPlugin<Context>(async context => {
        if (!context.wcp.canUseWorkflows()) {
            return;
        }
        context.plugins.register([
            createWorkflowModel(),
            await createContext(context),
            createSchema()
        ]);
    });
};
