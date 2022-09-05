import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { CmsContext } from "~/types";
import { createModelsSchema } from "./schema/contentModels";
import { createContentEntriesSchema } from "./schema/contentEntries";
import { createGroupsSchema } from "./schema/contentModelGroups";
import { createBaseContentSchema } from "./schema/baseContentSchema";
import { generateSchemaPlugins } from "./schema/schemaPlugins";

/**
 * This factory is called whenever we need to generate graphql-schema plugins using the current context.
 */

export const buildSchemaPlugins = async (
    context: CmsContext
): Promise<GraphQLSchemaPlugin<CmsContext>[]> => {
    return [
        // Base GQL types and scalars
        createBaseContentSchema(context),
        createModelsSchema(context),
        createContentEntriesSchema(context),
        createGroupsSchema(context),
        // Dynamic schema
        ...(await generateSchemaPlugins(context))
    ].filter(Boolean);
};
