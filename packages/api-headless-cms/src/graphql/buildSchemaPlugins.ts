import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { CmsContext } from "~/types";
import contentModels from "./schema/contentModels";
import contentEntries from "./schema/contentEntries";
import contentModelGroups from "./schema/contentModelGroups";
import { createBaseContentSchema } from "./schema/baseContentSchema";
import { generateSchemaPlugins } from "./schema/schemaPlugins";

/**
 * This factory is called whenever we need to generate graphql-schema plugins using the current context.
 */
export default async (context: CmsContext): Promise<GraphQLSchemaPlugin<CmsContext>[]> => {
    return [
        // Base GQL types and scalars
        createBaseContentSchema(context),
        contentModels(context),
        contentEntries(context),
        contentModelGroups(context),
        // Dynamic schema
        ...(await generateSchemaPlugins(context))
    ].filter(Boolean);
};
