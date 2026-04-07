import type { ApiEndpoint, CmsContext, CmsModel } from "~/types/index.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

const TYPE_MAP: Record<string, "manage" | "read"> = {
    preview: "read",
    read: "read",
    manage: "manage"
};

interface CreatePluginCallableParams {
    schema: GraphQLSchemaDefinition<CmsContext>;
    type: "manage" | "preview" | "read";
    fieldType: string;
}

interface CreatePluginCallable {
    (params: CreatePluginCallableParams): IGraphQLSchemaPlugin<CmsContext>;
}

const defaultCreatePlugin: CreatePluginCallable = ({ schema, type, fieldType }) => {
    const plugin = createCmsGraphQLSchemaPlugin(schema);
    plugin.name = `headless-cms.graphql.schema.${type}.field.${fieldType}`;
    return plugin;
};

interface Params {
    models: CmsModel[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    type: ApiEndpoint;
    createPlugin?: CreatePluginCallable;
}
export const createGraphQLSchemaPluginFromFieldPlugins = (params: Params) => {
    const { models, fieldRegistry, type, createPlugin = defaultCreatePlugin } = params;

    const apiType = TYPE_MAP[type];

    const plugins: ICmsGraphQLSchemaPlugin[] = [];
    for (const fieldTypePlugin of fieldRegistry.getAll()) {
        const api = apiType === "manage" ? fieldTypePlugin.manage : fieldTypePlugin.read;
        if (!apiType || !api) {
            continue;
        }
        const createSchema = api.createSchema;
        if (!createSchema) {
            continue;
        }
        const schema = createSchema({ models });

        const plugin = createPlugin({
            schema,
            type,
            fieldType: fieldTypePlugin.fieldType
        });
        plugins.push(plugin);
    }
    return plugins;
};
