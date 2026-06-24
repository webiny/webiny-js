import type { Container } from "@webiny/di";
import type { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";

class SchedulerModelContextualSchemaImpl implements IGraphQLContextualSchema {
    constructor(
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        const empty = makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });

        if (!this.tenantCtx.getTenant()) {
            return empty;
        }

        const container = ctx.container as Container;
        await this.identityCtx.withoutAuthorization(async () => {
            const result = await this.getModel.execute(SCHEDULE_MODEL_ID);
            if (result.isFail()) {
                throw result.error;
            }
            container.registerInstance(ScheduledActionModel, result.value);
        });

        return empty;
    }
}

export const SchedulerModelContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: SchedulerModelContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext, GetModelUseCase]
});
