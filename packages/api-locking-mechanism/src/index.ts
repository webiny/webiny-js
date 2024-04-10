import { createGraphQLSchema } from "~/graphql/schema";
import { ContextPlugin } from "@webiny/api";
import { Context } from "~/types";
import { createLockingMechanismCrud } from "~/crud/crud";
import { createLockingModel } from "~/crud/model";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";

const createContextPlugin = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        const ready = await isHeadlessCmsReady(context);
        if (!ready) {
            return;
        }
        context.plugins.register(createLockingModel());

        context.lockingMechanism = await createLockingMechanismCrud({
            context
        });

        const graphQlPlugin = await createGraphQLSchema({ context });
        context.plugins.register(graphQlPlugin);
    });
    plugin.name = "context.lockingMechanism";

    return plugin;
};

export const createLockingMechanism = () => {
    return [createContextPlugin()];
};
