import { CmsContext, CmsModel } from "~/types";
import { buildSchemaPlugins } from "./buildSchemaPlugins";
import { createExecutableSchema } from "./createExecutableSchema";
import { GraphQLSchema } from "graphql/type";
import { CmsGraphQLSchemaPlugin } from "~/plugins";

interface GenerateSchemaParams {
    context: CmsContext;
    models: CmsModel[];
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
