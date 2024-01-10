import { CmsFieldTypePlugins, CmsModel, CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins/CmsGraphQLSchemaSorterPlugin";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants";

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
        if (!plugin) {
            continue;
        } else if (plugin.createSorters) {
            const result = plugin.createSorters({
                model,
                field,
                sorters
            });
            if (result) {
                sorters = result;
                continue;
            }
        }
        if (!plugin.isSortable) {
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
