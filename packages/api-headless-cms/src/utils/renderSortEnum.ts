import { CmsFieldTypePlugins, CmsModel } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface RenderSortEnum {
    (params: { model: CmsModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model, fieldTypePlugins }): string => {
    const sorters: string[] = [
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
        }
        if (!plugin.isSortable) {
            continue;
        }
        sorters.push(`${field.fieldId}_ASC`);
        sorters.push(`${field.fieldId}_DESC`);
    }

    return sorters.join("\n");
};
