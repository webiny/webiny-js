import { CmsContext, CmsApiModel } from "~/types";
import { buildSchemaPlugins } from "~/graphql/buildSchemaPlugins";
import { createExecutableSchema } from "~/graphql/createExecutableSchema";
import { GraphQLSchema } from "graphql/type";
import { CmsGraphQLSchemaPlugin } from "~/plugins";

interface GenerateSchemaParams {
    context: CmsContext;
    models: CmsApiModel[];
}
export const generateSchema = async (params: GenerateSchemaParams): Promise<GraphQLSchema> => {
    const { context, models } = params;

    let generatedSchemaPlugins: CmsGraphQLSchemaPlugin[] = [];
    try {
        generatedSchemaPlugins = await buildSchemaPlugins({ context, models });
    } catch (ex) {
        console.log(`Error while building schema plugins.`);
        throw ex;
    }

    context.plugins.register(generatedSchemaPlugins);

    const schemaPlugins = context.plugins.byType<CmsGraphQLSchemaPlugin>(
        CmsGraphQLSchemaPlugin.type
    );
    return createExecutableSchema({
        plugins: schemaPlugins
    });
};
