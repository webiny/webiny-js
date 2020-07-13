import { CmsFieldTypePlugins, CmsContentModel } from "@webiny/api-headless-cms/types";

interface RenderListFilterFields {
    (params: {
        model: CmsContentModel;
        type: string;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const renderListFilterFields: RenderListFilterFields = ({
    model,
}) => {
    const uniqueIndexFields = model.getUniqueIndexFields();

    return uniqueIndexFields
        .map(fieldId => {
            if (fieldId === "id") {
                return ["id: ID", "id_not: ID", "id_in: [ID]", "id_not_in: [ID]"].join("\n");
            }
        })
        .filter(Boolean)
        .join("\n");
};
