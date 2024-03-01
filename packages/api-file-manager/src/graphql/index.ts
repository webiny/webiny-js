import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins";
import { createBaseSchema } from "~/graphql/baseSchema";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createFilesSchema } from "~/graphql/filesSchema";
import { getFileByUrl } from "~/graphql/getFileByUrl";
import { FileManagerContext } from "~/types";

export const createGraphQLSchemaPlugin = () => {
    return [
        createBaseSchema(),
        // Files schema is generated dynamically, based on a CMS model, so we need to
        // register it from a ContextPlugin, to perform additional bootstrap.
        new ContextPlugin<FileManagerContext>(async context => {
            if (!(await isHeadlessCmsReady(context))) {
                return;
            }

            await context.security.withoutAuthorization(async () => {
                const fileModel = (await context.cms.getModel("fmFile")) as CmsModel;
                const models = await context.cms.listModels();
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
