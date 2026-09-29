import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { RecordLockingModelProvider } from "~/domain/abstractions.js";
import { createGraphQLSchema } from "~/graphql/schema.js";

/**
 * The record locking GraphQL schema. The lock record type is rendered from the lock record model,
 * which is loaded when the schema is composed.
 */
class RecordLockingGraphQLSchemaImpl implements GraphQLSchemaFactory.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly modelProvider: RecordLockingModelProvider.Interface,
        private readonly listModelsUseCase: ListModelsUseCase.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface
    ) {}

    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        // There is no tenant until installation completes, and no model to render a schema from.
        if (!this.tenantContext.getTenant()) {
            return builder;
        }

        const model = await this.modelProvider.get();

        // The model list feeds `ref` field rendering. ListModels is filtered by permission, so it
        // is read without authorization to keep the schema the same for every identity.
        const models = await this.identityContext.withoutAuthorization(async () => {
            const result = await this.listModelsUseCase.execute({ includePrivate: false });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        const plugin = await createGraphQLSchema({
            model,
            models,
            fieldRegistry: this.fieldRegistry
        });

        builder.addTypeDefs(plugin.schema.typeDefs);
        if (plugin.schema.resolvers) {
            builder.addLegacyResolvers(plugin.schema.resolvers);
        }

        return builder;
    }
}

export const RecordLockingGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: RecordLockingGraphQLSchemaImpl,
    dependencies: [
        TenantContext,
        IdentityContext,
        RecordLockingModelProvider,
        ListModelsUseCase,
        CmsModelFieldToGraphQLRegistry
    ]
});
