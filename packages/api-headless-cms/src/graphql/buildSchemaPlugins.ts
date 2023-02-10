import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { CmsContext, CmsModel } from "~/types";
import { createModelsSchema } from "./schema/contentModels";
import { createContentEntriesSchema } from "./schema/contentEntries";
import { createGroupsSchema } from "./schema/contentModelGroups";
import { createBaseContentSchema } from "./schema/baseContentSchema";
import { generateSchemaPlugins } from "./schema/schemaPlugins";

/**
 * This factory is called whenever we need to generate graphql-schema plugins using the current context.
 */
interface BuildSchemaPluginsParams {
    context: CmsContext;
    models: CmsModel[];
}
export const buildSchemaPlugins = async (
    params: BuildSchemaPluginsParams
): Promise<GraphQLSchemaPlugin<CmsContext>[]> => {
    return [
        // Base GQL types and scalars
        createBaseContentSchema(params),
        createModelsSchema(params),
        createContentEntriesSchema(params),
        createGroupsSchema(params),
        // Dynamic schema
        ...(await generateSchemaPlugins(params))
    ].filter(Boolean);
};
