import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { RecordLockingModel, RECORD_LOCKING_MODEL_ID } from "~/domain/RecordLockingModel.js";
import { getTimeout } from "~/utils/getTimeout.js";
import { RecordLockingFeature } from "~/features/RecordLockingFeature.js";
import { createGraphQLSchema } from "~/graphql/schema.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

export interface ICreateContextPluginParams {
    /**
     * A number of seconds after the last activity to wait before the record is automatically unlocked.
     */
    timeout?: number;
}

const createContextPlugin = (params?: ICreateContextPluginParams) => {
    const recordLockingContextPlugin = new ContextPlugin<ApiCoreContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const identityContext = context.container.resolve(IdentityContext);
        const wcp = context.container.resolve(WcpContext);
        const getModel = context.container.resolve(GetModelUseCase);
        const listModels = context.container.resolve(ListModelsUseCase);

        if (!wcp.canUseRecordLocking() || !tenantContext.getTenant()) {
            return;
        }

        // Determine timeout value
        const timeout = getTimeout(params?.timeout);

        // Fetch CMS model to use for storing record locking data
        const [model, publicModels] = await identityContext.withoutAuthorization(async () => {
            const [model, publicModels] = await Promise.all([
                // Get a record locking model
                getModel.execute(RECORD_LOCKING_MODEL_ID),
                // Get all models
                listModels.execute({ includePrivate: false })
            ]);

            return [model.value, publicModels.value];
        });

        const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);

        // Register GraphQL schema plugin
        const graphQlPlugin = await createGraphQLSchema({
            model,
            models: publicModels,
            fieldRegistry
        });

        context.plugins.register(graphQlPlugin);

        // Register features
        RecordLockingFeature.register(context.container, {
            timeout,
            model
        });
    });
    recordLockingContextPlugin.name = "context.recordLocking";

    return recordLockingContextPlugin;
};

export const createRecordLocking = (params?: ICreateContextPluginParams) => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(RecordLockingModel);
    });

    return [createContextPlugin(params), modelsPlugin];
};

export { RecordLockingAppFeature } from "./RecordLockingAppFeature.js";
export type { IRecordLockingAppFeatureParams } from "./RecordLockingAppFeature.js";
