import type { CmsModelFieldToGraphQLPlugin } from "~/types/plugins.js";
import { type CmsModelFieldToGraphQL } from "~/features/graphql/index.js";

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
                createTypeField: params => read.createTypeField(params),
                createGetFilters: read.createGetFilters
                    ? params => read.createGetFilters!(params)
                    : undefined,
                createListFilters: read.createListFilters
                    ? params => read.createListFilters!(params)
                    : undefined,
                createResolver: read.createResolver
                    ? params => read.createResolver!(params)
                    : undefined,
                createSchema: read.createSchema ? params => read.createSchema!(params) : undefined
            },
            manage: {
                createTypeField: params => manage.createTypeField(params),
                createInputField: params => manage.createInputField(params),
                createListFilters: manage.createListFilters
                    ? params => manage.createListFilters!(params)
                    : undefined,
                createResolver: manage.createResolver
                    ? params => manage.createResolver!(params)
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
