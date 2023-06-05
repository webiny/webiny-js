import { createBaseSchema } from "~/graphql/baseSchema";
import { ContextPlugin } from "@webiny/api";
import { FileManagerContext } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { createFilesSchema } from "~/graphql/filesSchema";

export const createGraphQLSchemaPlugin = () => {
    return [
        createBaseSchema(),
        // Files schema is generated dynamically, based on a CMS model, so we need to
        // register it from a ContextPlugin, to perform additional bootstrap.
        new ContextPlugin<FileManagerContext>(async context => {
            await context.security.withoutAuthorization(async () => {
                const fileModel = (await context.cms.getModel("fmFile")) as CmsModel;
                const models = await context.cms.listModels();
                const fieldPlugins = createFieldTypePluginRecords(context.plugins);

                const graphQlPlugin = createFilesSchema({
                    model: fileModel,
                    models,
                    plugins: fieldPlugins
                });

                context.plugins.register(graphQlPlugin);
            });
        })
    ];
};
