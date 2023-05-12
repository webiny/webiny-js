import { AcoContext } from "~/types";
import { CmsFieldTypePlugins, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createAppsSchema } from "./graphql/createAppsSchema";
import { createAppsResolvers } from "./graphql/createAppsResolvers";

export const createSchema = async (context: AcoContext) => {
    const apps = context.aco.listApps();

    const plugins = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce<CmsFieldTypePlugins>((fields, plugin) => {
            fields[plugin.fieldType] = plugin;
            return fields;
        }, {});
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => {
            return !model.isPrivate;
        });
    });

    return new GraphQLSchemaPlugin({
        typeDefs: createAppsSchema({
            models,
            apps,
            plugins
        }),
        resolvers: createAppsResolvers({
            models,
            apps,
            plugins
        })
    });
};
