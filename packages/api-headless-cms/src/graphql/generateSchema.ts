import type { CmsContext, CmsModel } from "~/types/index.js";
import { buildSchemaPlugins } from "./buildSchemaPlugins.js";
import { createExecutableSchema } from "./createExecutableSchema.js";
import type { GraphQLSchema } from "graphql/type/index.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { CmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { CmsGraphQLCompat } from "./compat/types.js";

interface GenerateSchemaParams {
    context: CmsContext;
    models: CmsModel[];
    compat?: CmsGraphQLCompat;
}
export const generateSchema = async (params: GenerateSchemaParams): Promise<GraphQLSchema> => {
    const { context, models, compat } = params;

    let generatedSchemaPlugins: ICmsGraphQLSchemaPlugin[] = [];
    try {
        generatedSchemaPlugins = await buildSchemaPlugins({ context, models, compat });
    } catch (ex) {
        console.log(`Error while building schema plugins.`);
        throw ex;
    }

    context.plugins.register(generatedSchemaPlugins);

    const schemaPlugins = context.plugins
        .byType<ICmsGraphQLSchemaPlugin>(CmsGraphQLSchemaPlugin.type)
        .filter(pl => {
            if (typeof pl.isApplicable === "function") {
                return pl.isApplicable(context);
            }
            return true;
        });

    return createExecutableSchema({
        plugins: schemaPlugins
    });
};
