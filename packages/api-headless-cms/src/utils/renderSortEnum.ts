import type { CmsModel, CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type { CmsGraphQLSchemaSorterPlugin } from "~/plugins/CmsGraphQLSchemaSorterPlugin.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface RenderSortEnumParams {
    model: CmsModel;
    fields: CmsModelField[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    sorterPlugins?: CmsGraphQLSchemaSorterPlugin[];
}

interface RenderSortEnum {
    (params: RenderSortEnumParams): string;
}

export const renderSortEnum: RenderSortEnum = ({
    model,
    fields,
    fieldRegistry,
    sorterPlugins
}): string => {
    const sorters: string[] = [
        `id_ASC`,
        `id_DESC`,

        ...ENTRY_META_FIELDS.filter(isDateTimeEntryMetaField)
            .map(field => [`${field}_ASC`, `${field}_DESC`])
            .flat()
    ];

    for (const field of fields) {
        const plugin = fieldRegistry.get(getBaseFieldType(field));
        if (!plugin?.isSortable) {
            continue;
        }
        sorters.push(`values_${field.fieldId}_ASC`);
        sorters.push(`values_${field.fieldId}_DESC`);
    }
    if (!sorterPlugins) {
        return sorters.join("\n");
    }

    return sorterPlugins
        .reduce((result, plugin) => {
            return plugin.createSorter({
                model,
                sorters: result
            });
        }, sorters)
        .join("\n");
};
