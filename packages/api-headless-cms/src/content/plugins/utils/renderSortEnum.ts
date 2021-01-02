import { CmsFieldTypePlugins, CmsContentModelType } from "@webiny/api-headless-cms/types";

interface RenderSortEnum {
    (params: { model: CmsContentModelType; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model, fieldTypePlugins }) => {
    const sorters = [
        `id_ASC`,
        `id_DESC`,
        "savedOn_ASC",
        "savedOn_DESC",
        "createdOn_ASC",
        "createdOn_DESC"
    ];

    const fieldIds = model.fields
        .filter(f => fieldTypePlugins[f.type].isSortable)
        .map(f => f.fieldId);

    fieldIds.forEach(fieldId => {
        sorters.push(`${fieldId}_ASC`);
        sorters.push(`${fieldId}_DESC`);
    });

    return sorters.join("\n");
};
