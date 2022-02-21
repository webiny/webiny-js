import { CmsModel, CmsContext, CmsFieldTypePlugins, ApiEndpoint } from "~/types";
import { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types";

interface RenderTypesFromFieldPluginsParams {
    models: CmsModel[];
    fieldTypePlugins: CmsFieldTypePlugins;
    type: ApiEndpoint;
}
interface RenderTypesFromFieldPlugins {
    (params: RenderTypesFromFieldPluginsParams): GraphQLSchemaDefinition<CmsContext>[];
}

const TYPE_MAP: Record<string, "manage" | "read"> = {
    preview: "read",
    read: "read",
    manage: "manage"
};

export const getSchemaFromFieldPlugins: RenderTypesFromFieldPlugins = ({
    models,
    fieldTypePlugins,
    type
}) => {
    return Object.values(fieldTypePlugins)
        .map(plugin => {
            // Render gql types generated by field type plugins
            if (typeof plugin[TYPE_MAP[type]].createSchema !== "function") {
                return null;
            }
            return plugin[TYPE_MAP[type]].createSchema({ models });
        })
        .filter(Boolean);
};
