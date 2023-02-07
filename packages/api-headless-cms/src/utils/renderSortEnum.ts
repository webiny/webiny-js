import { CmsFieldTypePlugins, CmsModel } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins/CmsGraphQLSchemaSorterPlugin";

interface RenderSortEnumParams {
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins: CmsGraphQLSchemaSorterPlugin[];
}
interface RenderSortEnum {
    (params: RenderSortEnumParams): string;
}

export const renderSortEnum: RenderSortEnum = ({
    model,
    fieldTypePlugins,
    sorterPlugins
}): string => {
    let sorters: string[] = [
        `id_ASC`,
        `id_DESC`,
        "savedOn_ASC",
        "savedOn_DESC",
        "createdOn_ASC",
        "createdOn_DESC"
    ];

    for (const field of model.fields) {
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

    return sorterPlugins
        .reduce((result, plugin) => {
            return plugin.createSorter({
                model,
                sorters: result
            });
        }, sorters)
        .join("\n");
};
