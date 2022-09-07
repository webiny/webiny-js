import { CmsFieldTypePlugins, CmsModel } from "~/types";

interface RenderSortEnum {
    (params: { model: CmsModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model, fieldTypePlugins }): string => {
    const sorters = [
        `id_ASC`,
        `id_DESC`,
        "savedOn_ASC",
        "savedOn_DESC",
        "createdOn_ASC",
        "createdOn_DESC"
    ];

    for (const field of model.fields) {
        if (!fieldTypePlugins[field.type]) {
            continue;
        }
        const isSortable = fieldTypePlugins[field.type].isSortable;
        if (!isSortable) {
            continue;
        }
        sorters.push(`${field.fieldId}_ASC`);
        sorters.push(`${field.fieldId}_DESC`);
    }

    return sorters.join("\n");
};
