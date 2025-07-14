import type { CmsModelField, CmsModelFieldToGraphQLPlugin, IFullTextSearchFields } from "~/types";
import type { PluginsContainer } from "@webiny/plugins";
import { FullTextSearchFields } from "./FullTextSearchFields";

interface IGetSearchableFieldsParams {
    input: string[];
    fields: CmsModelField[];
    plugins: PluginsContainer;
}

export const getSearchableFields = (params: IGetSearchableFieldsParams): IFullTextSearchFields => {
    const { plugins, input, fields } = params;
    const fieldPluginMap = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((collection, field) => {
            collection[field.fieldType] = field;
            return collection;
        }, {} as Record<string, CmsModelFieldToGraphQLPlugin>);

    return new FullTextSearchFields({
        fields,
        allowedFields: input,
        plugins: fieldPluginMap
    });
};
