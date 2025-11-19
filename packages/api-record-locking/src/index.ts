import { createGraphQLSchema } from "~/graphql/schema.js";
import { ContextPlugin } from "@webiny/api";
import type { Context } from "~/types.js";
import { createRecordLockingCrud } from "~/crud/crud.js";
import { createLockingModel } from "~/crud/model.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { RecordLockingConfig, RecordLockingModel } from "~/domain/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { RECORD_LOCKING_MODEL_ID } from "~/domain/model.js";

export interface ICreateContextPluginParams {
    /**
     * A number of seconds after the last activity to wait before the record is automatically unlocked.
     */
    timeout?: number;
}

const createContextPlugin = (params?: ICreateContextPluginParams) => {
    const plugin = new ContextPlugin<Context>(async context => {
        const wcp = context.container.resolve(WcpContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!wcp.canUseRecordLocking()) {
            return;
        }

        context.plugins.register(createLockingModel());

        context.recordLocking = await createRecordLockingCrud({
            context,
            timeout: params?.timeout
        });

        const graphQlPlugin = await createGraphQLSchema({ context });

        context.plugins.register(graphQlPlugin);

        const recordLockingModel = await getModel.execute(RECORD_LOCKING_MODEL_ID);

        // Register new abstractions
        context.container.registerInstance(RecordLockingModel, recordLockingModel.value);
        context.container.registerInstance(RecordLockingConfig, {
            timeout: params?.timeout
        });
    });
    plugin.name = "context.recordLocking";

    return plugin;
};

export const createRecordLocking = (params?: ICreateContextPluginParams) => {
    return [createContextPlugin(params)];
};
