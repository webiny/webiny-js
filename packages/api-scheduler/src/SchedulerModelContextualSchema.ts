import type { Container } from "@webiny/di";
import { GraphQLContextInitializer } from "@webiny/handler-graphql";
import type { IGraphQLContextInitializer } from "@webiny/handler-graphql";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";

class SchedulerModelContextualSchemaImpl implements IGraphQLContextInitializer {
    constructor(
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface
    ) {}

    async init(ctx: Record<string, any>): Promise<void> {
        if (!this.tenantCtx.getTenant()) {
            return;
        }

        const container = ctx.container as Container;
        // Resolved lazily here (build/request time), not as a constructor dep: GetModelUseCase
        // depends on AccessControl, which the CMS initializer only registers during its own init().
        const getModel = container.resolve(GetModelUseCase);

        await this.identityCtx.withoutAuthorization(async () => {
            const result = await getModel.execute(SCHEDULE_MODEL_ID);
            if (result.isFail()) {
                throw result.error;
            }
            container.registerInstance(ScheduledActionModel, result.value);
        });
    }
}

export const SchedulerModelContextualSchema = GraphQLContextInitializer.createImplementation({
    implementation: SchedulerModelContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext]
});
