import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";

interface RenderSortEnum {
    (params: { model: CmsModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model, fieldTypePlugins }) => {
    const sorters = [];
    model.fields
        .filter(f => fieldTypePlugins[f.type].isSortable)
        .forEach(f => {
            sorters.push(`${f.fieldId}_ASC`);
            sorters.push(`${f.fieldId}_DESC`);
        });

    return sorters.join("\n");
};
