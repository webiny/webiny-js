import type { Container } from "@webiny/di";
import type { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { createBaseContentSchema } from "@webiny/api-headless-cms/graphql/schema/baseContentSchema.js";
import { RECORD_LOCKING_MODEL_ID } from "~/domain/RecordLockingModel.js";
import {
    RecordLockingAppConfig,
    type IRecordLockingAppConfig
} from "~/domain/RecordLockingAppConfig.js";
import { RecordLockingFeature } from "~/features/RecordLockingFeature.js";
import { createGraphQLSchema } from "~/graphql/schema.js";

class RecordLockingContextualSchemaImpl implements IGraphQLContextualSchema {
    constructor(
        private wcp: WcpContext.Interface,
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface,
        private config: IRecordLockingAppConfig
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.wcp.canUseRecordLocking() || !this.tenantCtx.getTenant()) {
            return makeExecutableSchema({
                typeDefs: "type Query\ntype Mutation",
                assumeValidSDL: true
            });
        }

        const container = ctx.container as Container;

        // Resolve the CMS use-cases lazily here (at build/request time) rather than as
        // constructor dependencies. They depend on AccessControl/CmsContext, which the CMS
        // initializer only registers during its own build() — so injecting them eagerly would
        // fail when the engine constructs all contextual schemas before any build() has run.
        const getModel = container.resolve(GetModelUseCase);
        const listModels = container.resolve(ListModelsUseCase);
        const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

        const [model, publicModels] = await this.identityCtx.withoutAuthorization(async () => {
            const [modelResult, publicModelsResult] = await Promise.all([
                getModel.execute(RECORD_LOCKING_MODEL_ID),
                listModels.execute({ includePrivate: false })
            ]);

            return [modelResult.value, publicModelsResult.value];
        });

        RecordLockingFeature.register(container, {
            timeout: this.config.timeout,
            model
        });

        const plugin = await createGraphQLSchema({
            model,
            models: publicModels,
            fieldRegistry
        });

        // The generated record-locking model schema references CMS base scalars (DateTime, JSON,
        // etc.). Include createBaseContentSchema() — which declares those scalars and their
        // resolvers — exactly as the normal CMS schema build (buildSchemaPlugins) does, so this
        // standalone schema is self-contained and valid before it is merged by the engine.
        const baseContent = createBaseContentSchema();

        return makeExecutableSchema({
            typeDefs: [baseContent.schema.typeDefs as string, plugin.schema.typeDefs as string],
            resolvers: mergeResolvers([
                baseContent.schema.resolvers as any,
                plugin.schema.resolvers as any
            ]),
            inheritResolversFromInterfaces: true
        });
    }
}

export const RecordLockingContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: RecordLockingContextualSchemaImpl,
    dependencies: [WcpContext, TenantContext, IdentityContext, RecordLockingAppConfig]
});
