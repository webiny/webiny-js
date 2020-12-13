import { CmsFieldTypePlugins, CmsContentModelType } from "@webiny/api-headless-cms/types";

interface RenderSortEnum {
    (params: { model: CmsContentModelType; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderSortEnum: RenderSortEnum = ({ model }) => {
    const sorters = [];
    (model as any).getUniqueIndexFields().forEach(fieldId => {
        sorters.push(`${fieldId}_ASC`);
        sorters.push(`${fieldId}_DESC`);
    });

    return sorters.join("\n");
};
