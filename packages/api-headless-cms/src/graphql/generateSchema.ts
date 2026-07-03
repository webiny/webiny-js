import type { ApiEndpoint, CmsContext, CmsModel } from "~/types/index.js";
import { buildSchemaPlugins } from "./buildSchemaPlugins.js";
import { createExecutableSchema } from "./createExecutableSchema.js";
import type { GraphQLSchema } from "graphql/type/index.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { CmsGraphQLSchemaFactory } from "./CmsGraphQLSchemaFactory.js";

interface GenerateSchemaParams {
    context: CmsContext;
    models: CmsModel[];
    type: ApiEndpoint | null;
}
export const generateSchema = async (params: GenerateSchemaParams): Promise<GraphQLSchema> => {
    const { context, models, type } = params;

    let generatedSchemaPlugins: ICmsGraphQLSchemaPlugin[] = [];
    try {
        generatedSchemaPlugins = await buildSchemaPlugins({ context, models, type });
    } catch (ex) {
        console.log(`Error while building schema plugins.`);
        throw ex;
    }

    const staticFactories = context.container.resolveAll(CmsGraphQLSchemaFactory);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const staticPlugins: ICmsGraphQLSchemaPlugin<any>[] = [];
    for (const factory of staticFactories) {
        const plugins = await factory.execute();
        staticPlugins.push(...plugins);
    }

    const schemaPlugins = [...staticPlugins, ...generatedSchemaPlugins].filter(pl => {
        if (typeof pl.isApplicable === "function") {
            return pl.isApplicable(context);
        }
        return true;
    });

    return createExecutableSchema({ plugins: schemaPlugins });
};
