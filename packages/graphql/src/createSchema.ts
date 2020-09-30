import { addSchemaLevelResolveFunction } from "graphql-tools";
import { GraphQLSchema } from "graphql";
import { Context } from "./types";
import { prepareSchema } from "./createSchema/prepareSchema";
import { applyContextPlugins } from "./createSchema/contextPlugins";

/**
 * Create graphql schema only
 * @returns {Promise<void>}
 * @param context
 */
const createSchema = async (context: any): Promise<{ schema: GraphQLSchema; context: Context }> => {
    // eslint-disable-next-line prefer-const
    const { schema } = await prepareSchema(context);

    addSchemaLevelResolveFunction(schema, async (root, args, context, info) => {
        // Make sure we do not block this resolver from processing subsequent requests!
        // This is something that is baked into the graphql-tools and cannot be avoided another way.
        delete info.operation["__runAtMostOnce"];

        // Process `context` plugins
        await applyContextPlugins(context);
    });

    return { schema, context };
};

export default createSchema;
