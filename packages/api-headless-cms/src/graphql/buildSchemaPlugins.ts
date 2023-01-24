import { CmsContext } from "~/types";
import { createModelsSchema } from "./schema/contentModels";
import { createContentEntriesSchema } from "./schema/contentEntries";
import { createGroupsSchema } from "./schema/contentModelGroups";
import { createBaseContentSchema } from "./schema/baseContentSchema";
import { generateSchemaPlugins } from "./schema/schemaPlugins";
import { CmsGraphQLSchemaPlugin } from "~/plugins";

/**
 * This factory is called whenever we need to generate graphql-schema plugins using the current context.
 */

export const buildSchemaPlugins = async (
    context: CmsContext
): Promise<CmsGraphQLSchemaPlugin[]> => {
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
