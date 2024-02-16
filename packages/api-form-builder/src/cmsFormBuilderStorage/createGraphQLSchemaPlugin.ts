import { ContextPlugin } from "@webiny/api";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins";

import { isInstallationPending } from "~/cmsFormBuilderStorage/isInstallationPending";
import { createFormBuilderSettingsSchema } from "~/plugins/graphql/formSettings";
import { createBaseSchema } from "~/plugins/graphql";
import { createSubmissionsSchema } from "~/plugins/graphql/submissionsSchema";
import { createFormsSchema } from "~/plugins/graphql/formsSchema";
import { createFormStatsSchema } from "~/plugins/graphql/formStatsSchema";
import { FormBuilderContext } from "~/types";

export const createGraphQLSchemaPlugin = () => {
    return [
        createBaseSchema(),
        createFormBuilderSettingsSchema(),
        // Submission schema is generated dynamically, based on a CMS model, so we need to
        // register it from a ContextPlugin, to perform additional bootstrap.
        new ContextPlugin<FormBuilderContext>(async context => {
            if (isInstallationPending(context)) {
                return;
            }

            await context.security.withoutAuthorization(async () => {
                const submissionModel = (await context.cms.getModel("fbSubmission")) as CmsModel;
                const formsModel = (await context.cms.getModel("fbForm")) as CmsModel;
                const formStatsModel = (await context.cms.getModel("fbFormStat")) as CmsModel;
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
                        plugin.name = `fb.graphql.schema.${type}.field.${fieldType}`;
                        return plugin;
                    }
                });

                const formsGraphQlPlugin = createFormsSchema({
                    model: formsModel,
                    models,
                    plugins: fieldPlugins
                });

                const formStatsGraphQlPlugin = createFormStatsSchema({
                    model: formStatsModel,
                    models,
                    plugins: fieldPlugins
                });

                const submissionsGraphQlPlugin = createSubmissionsSchema({
                    model: submissionModel,
                    models,
                    plugins: fieldPlugins
                });

                context.plugins.register([
                    ...plugins,
                    formsGraphQlPlugin,
                    formStatsGraphQlPlugin,
                    submissionsGraphQlPlugin
                ]);
            });
        })
    ];
};
