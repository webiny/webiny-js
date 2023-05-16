import { AcoContext, IAcoApp } from "~/types";
import { CmsFieldTypePlugins, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createAppSchema } from "./graphql/createAppSchema";
import { createAppResolvers } from "./graphql/createAppResolvers";

interface Params {
    context: AcoContext;
    app: IAcoApp;
}

export const createSchema = async (params: Params) => {
    const { context, app } = params;
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

    return context.benchmark.measure(`aco.schema.generate.${app.name}`, async () => {
        const plugin = new GraphQLSchemaPlugin({
            typeDefs: createAppSchema({
                models,
                app,
                plugins
            }),
            resolvers: createAppResolvers({
                models,
                app,
                plugins
            })
        });
        plugin.name = `aco.graphql.appSchema.searchRecord.${app.name}`;
        return plugin;
    });
};
