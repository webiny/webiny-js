import type { CmsFieldTypePlugins, CmsModel, CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type { CmsGraphQLSchemaSorterPlugin } from "~/plugins/CmsGraphQLSchemaSorterPlugin.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";

interface RenderSortEnumParams {
    model: CmsModel;
    fields: CmsModelField[];
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins?: CmsGraphQLSchemaSorterPlugin[];
}

interface RenderSortEnum {
    (params: RenderSortEnumParams): string;
}

export const renderSortEnum: RenderSortEnum = ({
    model,
    fields,
    fieldTypePlugins,
    sorterPlugins
}): string => {
    let sorters: string[] = [
        `id_ASC`,
        `id_DESC`,

        ...ENTRY_META_FIELDS.filter(isDateTimeEntryMetaField)
            .map(field => [`${field}_ASC`, `${field}_DESC`])
            .flat()
    ];

    for (const field of fields) {
        const plugin = fieldTypePlugins[getBaseFieldType(field)];
        if (!plugin?.isSortable) {
            continue;
        }
        sorters.push(`${field.fieldId}_ASC`);
        sorters.push(`${field.fieldId}_DESC`);
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
