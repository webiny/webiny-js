import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { createLockingModel, RECORD_LOCKING_MODEL_ID } from "~/domain/model.js";
import { getTimeout } from "~/utils/getTimeout.js";
import { RecordLockingFeature } from "~/features/RecordLockingFeature.js";
import { createGraphQLSchema } from "~/graphql/schema.js";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export interface ICreateContextPluginParams {
    /**
     * A number of seconds after the last activity to wait before the record is automatically unlocked.
     */
    timeout?: number;
}

const createContextPlugin = (params?: ICreateContextPluginParams) => {
    const plugin = new ContextPlugin<ApiCoreContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const identityContext = context.container.resolve(IdentityContext);
        const wcp = context.container.resolve(WcpContext);
        const getModel = context.container.resolve(GetModelUseCase);
        const listModels = context.container.resolve(ListModelsUseCase);

        if (!wcp.canUseRecordLocking() || !tenantContext.getTenant()) {
            return;
        }

        // Register model plugin
        const modelDefinition = createLockingModel();
        context.plugins.register(modelDefinition);

        // Determine timeout value
        const timeout = getTimeout(params?.timeout);

        // Fetch CMS model to use for storing record locking data
        const recordLockingModel = await identityContext.withoutAuthorization(() => {
            return getModel.execute(RECORD_LOCKING_MODEL_ID);
        });

        const publicModels = await listModels.execute({ includePrivate: false });

        // Register GraphQL schema plugin
        const graphQlPlugin = await createGraphQLSchema({
            model: recordLockingModel.value,
            models: publicModels.value,
            fieldTypePlugins: createFieldTypePluginRecords(context.plugins)
        });

        context.plugins.register(graphQlPlugin);

        // Register features
        RecordLockingFeature.register(context.container, {
            timeout,
            model: recordLockingModel.value
        });
    });
    plugin.name = "context.recordLocking";

    return plugin;
};

export const createRecordLocking = (params?: ICreateContextPluginParams) => {
    return [createContextPlugin(params)];
};
