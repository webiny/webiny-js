import { CmsFieldTypePlugins, CmsContentModel } from "@webiny/api-headless-cms/types";

interface RenderSortEnum {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model }) => {
    const sorters = [];
    model.getUniqueIndexFields().forEach(fieldId => {
        sorters.push(`${fieldId}_ASC`);
        sorters.push(`${fieldId}_DESC`);
    });

    return sorters.join("\n");
};
