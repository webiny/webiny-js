import { CmsFieldTypePlugins, CmsContentModelType } from "@webiny/api-headless-cms/types";

interface RenderListFilterFields {
    (params: {
        model: CmsContentModelType;
        type: string;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const renderListFilterFields: RenderListFilterFields = ({
    model,
    type,
    fieldTypePlugins
}) => {
    const uniqueIndexFields = (model as any).getUniqueIndexFields();

    return uniqueIndexFields
        .map(fieldId => {
            if (fieldId === "id") {
                return ["id: ID", "id_not: ID", "id_in: [ID]", "id_not_in: [ID]"].join("\n");
            }

            const field = model.fields.find(item => item.fieldId === fieldId);
            const { createListFilters } = fieldTypePlugins[field.type][type];
            if (typeof createListFilters === "function") {
                return createListFilters({ model, field });
            }
        })
        .filter(Boolean)
        .join("\n");
};
