import type { CmsContext, CmsModel } from "~/types/index.js";
import { buildSchemaPlugins } from "./buildSchemaPlugins.js";
import { createExecutableSchema } from "./createExecutableSchema.js";
import type { GraphQLSchema } from "graphql/type/index.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { CmsGraphQLSchemaPlugin } from "~/plugins/index.js";

/**
 * Plugins generated for a specific endpoint (their SDL depends on `context.cms.READ/PREVIEW/MANAGE`
 * at generation time). They are registered into `context.plugins`, so we must remember them to
 * exclude them when a schema for another endpoint is generated within the same request.
 */
const generatedPlugins = new WeakSet<ICmsGraphQLSchemaPlugin>();

interface GenerateSchemaParams {
    context: CmsContext;
    models: CmsModel[];
}
export const generateSchema = async (params: GenerateSchemaParams): Promise<GraphQLSchema> => {
    const { context, models } = params;

    let generatedSchemaPlugins: ICmsGraphQLSchemaPlugin[] = [];
    try {
        generatedSchemaPlugins = await buildSchemaPlugins({ context, models });
    } catch (ex) {
        console.log(`Error while building schema plugins.`);
        throw ex;
    }

    for (const plugin of generatedSchemaPlugins) {
        generatedPlugins.add(plugin);
    }
    context.plugins.register(generatedSchemaPlugins);

    const currentlyGenerated = new Set(generatedSchemaPlugins);

    const schemaPlugins = context.plugins
        .byType<ICmsGraphQLSchemaPlugin>(CmsGraphQLSchemaPlugin.type)
        .filter(pl => {
            // Security: skip plugins generated earlier in this request for another endpoint
            // (e.g. manage-only mutations when generating the read schema).
            if (generatedPlugins.has(pl) && !currentlyGenerated.has(pl)) {
                return false;
            }
            if (typeof pl.isApplicable === "function") {
                return pl.isApplicable(context);
            }
            return true;
        });

    return createExecutableSchema({
        plugins: schemaPlugins
    });
};
