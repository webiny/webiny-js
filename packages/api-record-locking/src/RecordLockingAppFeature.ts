import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { RecordLockingModel, RECORD_LOCKING_MODEL_ID } from "~/domain/RecordLockingModel.js";
import { getTimeout } from "~/utils/getTimeout.js";
import { RecordLockingFeature } from "~/features/RecordLockingFeature.js";
import { createGraphQLSchema } from "~/graphql/schema.js";

export interface IRecordLockingAppFeatureParams {
    /**
     * A number of seconds after the last activity to wait before the record is automatically unlocked.
     */
    timeout?: number;
}

export const RecordLockingAppFeature = createFeature<IRecordLockingAppFeatureParams>({
    name: "RecordLockingApp",
    register(container: Container, params: IRecordLockingAppFeatureParams) {
        container.register(RecordLockingModel);

        let initialized = false;

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                const tenantContext = container.resolve(TenantContext);
                const identityContext = container.resolve(IdentityContext);
                const wcp = container.resolve(WcpContext);
                const getModel = container.resolve(GetModelUseCase);
                const listModels = container.resolve(ListModelsUseCase);

                if (!wcp.canUseRecordLocking() || !tenantContext.getTenant()) {
                    return;
                }

                const timeout = getTimeout(params?.timeout);

                const [model, publicModels] = await identityContext.withoutAuthorization(
                    async () => {
                        const [model, publicModels] = await Promise.all([
                            getModel.execute(RECORD_LOCKING_MODEL_ID),
                            listModels.execute({ includePrivate: false })
                        ]);

                        return [model.value, publicModels.value];
                    }
                );

                const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

                const graphQlPlugin = await createGraphQLSchema({
                    model,
                    models: publicModels,
                    fieldRegistry
                });

                ctx.plugins.register(graphQlPlugin);

                RecordLockingFeature.register(container, {
                    timeout,
                    model
                });
            }
        };

        container.registerInstance(GraphQLContextEnhancer, enhancer);
    }
});
