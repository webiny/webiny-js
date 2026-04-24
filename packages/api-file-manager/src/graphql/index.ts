import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins.js";
import { createBaseSchema } from "~/graphql/baseSchema.js";
import { createFilesSchema } from "~/graphql/filesSchema.js";
import { getFileByUrl } from "~/graphql/getFileByUrl.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

export const createGraphQLSchemaPlugin = () => {
    return [
        createBaseSchema(),
        // Files schema is generated dynamically, based on a CMS model, so we need to
        // register it from a ContextPlugin, to perform additional bootstrap.
        new ContextPlugin<ApiCoreContext>(async context => {
            const tenantContext = context.container.resolve(TenantContext);
            if (!tenantContext.getTenant()) {
                return;
            }

            const fileModel = context.container.resolve(FileModel);
            const listModels = context.container.resolve(ListModelsUseCase);
            const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);

            await context.security.withoutAuthorization(async () => {
                const modelsResult = await listModels.execute();
                const models = modelsResult.value;

                /**
                 * We need to register all plugins for all the CMS fields.
                 */
                const plugins = createGraphQLSchemaPluginFromFieldPlugins({
                    models,
                    type: "manage",
                    fieldRegistry,
                    createPlugin: ({ schema, type, fieldType }) => {
                        const plugin = new GraphQLSchemaPlugin(schema);
                        plugin.name = `fm.graphql.schema.${type}.field.${fieldType}`;
                        return plugin;
                    }
                });

                const graphQlPlugin = createFilesSchema({
                    model: fileModel,
                    models,
                    fieldRegistry
                });

                context.plugins.register([...plugins, graphQlPlugin, getFileByUrl()]);
            });
        })
    ];
};
