import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins.js";
import { createBaseSchema } from "~/graphql/baseSchema.js";
import { createFilesSchema } from "~/graphql/filesSchema.js";
import { getFileByUrl } from "~/graphql/getFileByUrl.js";
import { FileModel } from "~/domain/file/abstractions.js";

export const createGraphQLSchemaPlugin = () => {
    return [
        createBaseSchema(),
        // Files schema is generated dynamically, based on a CMS model, so we need to
        // register it from a ContextPlugin, to perform additional bootstrap.
        new ContextPlugin<ApiCoreContext>(async context => {
            const fileModel = context.container.resolve(FileModel);
            const listModels = context.container.resolve(ListModelsUseCase);

            await context.security.withoutAuthorization(async () => {
                const modelsResult = await listModels.execute();
                const models = modelsResult.value;

                const fieldPlugins = createFieldTypePluginRecords(context.plugins);
                /**
                 * We need to register all plugins for all the CMS fields.
                 */
                const plugins = createGraphQLSchemaPluginFromFieldPlugins({
                    models,
                    type: "manage",
                    fieldTypePlugins: fieldPlugins,
                    createPlugin: ({ schema, type, fieldType }) => {
                        const plugin = new GraphQLSchemaPlugin(schema);
                        plugin.name = `fm.graphql.schema.${type}.field.${fieldType}`;
                        return plugin;
                    }
                });

                const graphQlPlugin = createFilesSchema({
                    model: fileModel,
                    models,
                    plugins: fieldPlugins
                });

                context.plugins.register([...plugins, graphQlPlugin, getFileByUrl()]);
            });
        })
    ];
};
