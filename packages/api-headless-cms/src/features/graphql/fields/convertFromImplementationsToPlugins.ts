import type { CmsModelFieldToGraphQLPlugin } from "~/types/plugins.js";
import { type CmsModelFieldToGraphQL } from "~/features/graphql/index.js";

/**
 * @deprecated This bridge is no longer needed. Use CmsModelFieldToGraphQLRegistry directly.
 */
export const convertFromImplementationsToPlugins = (
    implementations: CmsModelFieldToGraphQL.Interface[]
): CmsModelFieldToGraphQLPlugin[] => {
    return implementations.map(impl => {
        const read = impl.getReadApi();
        const manage = impl.getManageApi();

        const plugin: CmsModelFieldToGraphQLPlugin = {
            name: `cms-model-field-to-graphql-${impl.fieldType}`,
            type: "cms-model-field-to-graphql",
            fieldType: impl.fieldType,
            isSearchable: impl.isSearchable,
            isSortable: impl.isSortable,
            fullTextSearch: impl.isFullTextSearchable,
            read: {
                createTypeField: params => read.createTypeField(params as any),
                createGetFilters: read.createGetFilters
                    ? params => read.createGetFilters!(params)
                    : undefined,
                createListFilters: read.createListFilters
                    ? params => read.createListFilters!(params as any)
                    : undefined,
                createResolver: read.createResolver
                    ? params => read.createResolver!(params as any)
                    : undefined,
                createSchema: read.createSchema ? params => read.createSchema!(params) : undefined
            },
            manage: {
                createTypeField: params => manage.createTypeField(params as any),
                createInputField: params => manage.createInputField(params as any),
                createListFilters: manage.createListFilters
                    ? params => manage.createListFilters!(params as any)
                    : undefined,
                createResolver: manage.createResolver
                    ? params => manage.createResolver!(params as any)
                    : undefined,
                createSchema: manage.createSchema
                    ? params => manage.createSchema!(params)
                    : undefined,
                normalizeInput: manage.normalizeInput
                    ? params => manage.normalizeInput!(params)
                    : undefined
            }
        };

        if (impl.validateChildFields) {
            plugin.validateChildFields = params => impl.validateChildFields!(params);
        }

        if (impl.getFieldAst) {
            plugin.getFieldAst = (field, converter) => impl.getFieldAst!(field, converter);
        }

        return plugin;
    });
};
