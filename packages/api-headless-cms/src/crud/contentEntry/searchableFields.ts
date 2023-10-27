import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

interface BuildParams {
    input: string[];
    fields: CmsModelField[];
    plugins: Record<string, CmsModelFieldToGraphQLPlugin>;
    parents: string[];
}
const buildSearchableFieldList = (params: BuildParams): string[] => {
    const { input, plugins, fields, parents } = params;
    return fields.reduce<string[]>((result, field) => {
        /**
         * We need to check if the field is full text searchable, and for that we need a plugin for the field type.
         */
        const plugin = plugins[field.type];
        if (!plugin) {
            return result;
        }
        /**
         * There is a possibility that searchable fields exist in nested object field, so check that as well.
         */
        const childFields = field.settings?.fields || [];
        if (childFields.length > 0) {
            /**
             * So we build a list of searchable child fields and push it into the main result set.
             */
            const childResults = buildSearchableFieldList({
                fields: childFields,
                parents: [...parents, field.fieldId],
                plugins,
                input
            });

            result.push(...childResults);
            return result;
        }
        /**
         * If not searchable, continue further.
         */
        if (!plugin.fullTextSearch || field.settings?.disableFullTextSearch === true) {
            return result;
        }

        /**
         * Combine all parent paths with the current one and push it.
         */
        const path = [...parents, field.fieldId].join(".");
        result.push(path);

        return result;
    }, []);
};

interface Params {
    input: string[];
    fields: CmsModelField[];
    plugins: PluginsContainer;
}
export const getSearchableFields = (params: Params): string[] => {
    const { plugins, input, fields } = params;
    const fieldPluginMap = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((collection, field) => {
            collection[field.fieldType] = field;
            return collection;
        }, {} as Record<string, CmsModelFieldToGraphQLPlugin>);

    return buildSearchableFieldList({
        fields,
        input,
        plugins: fieldPluginMap,
        parents: []
    });
};
