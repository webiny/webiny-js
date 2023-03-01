import { CmsContext, CmsModel } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { buildSchemaPlugins } from "~/graphql/buildSchemaPlugins";
import { createExecutableSchema } from "~/graphql/createExecutableSchema";
import { GraphQLSchema } from "graphql/type";

interface GenerateSchemaParams {
    context: CmsContext;
    models: CmsModel[];
}
export const generateSchema = async (params: GenerateSchemaParams): Promise<GraphQLSchema> => {
    const { context, models } = params;

    let generatedSchemaPlugins: GraphQLSchemaPlugin<CmsContext>[] = [];
    try {
        generatedSchemaPlugins = await buildSchemaPlugins({ context, models });
    } catch (ex) {
        console.log(`Error while building schema plugins.`);
        throw ex;
    }

    context.plugins.register(generatedSchemaPlugins);

    const schemaPlugins = context.plugins.byType<GraphQLSchemaPlugin>(GraphQLSchemaPlugin.type);
    return createExecutableSchema({
        plugins: schemaPlugins
    });
};
