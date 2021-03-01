import { CmsFieldTypePlugins, CmsContentModel } from "../../../types";

interface RenderGetFilterFields {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderGetFilterFields: RenderGetFilterFields = ({ model, fieldTypePlugins }) => {
    const fieldIds = model.fields
        .filter(f => fieldTypePlugins[f.type].isSearchable)
        .map(f => f.fieldId);

    const filters = ["id: ID"];

    for (let i = 0; i < fieldIds.length; i++) {
        const field = model.fields.find(item => item.fieldId === fieldIds[i]);
        const { createGetFilters } = fieldTypePlugins[field.type]["read"];
        if (typeof createGetFilters === "function") {
            filters.push(createGetFilters({ model, field }));
        }
    }

    return filters.filter(Boolean).join("\n");
};
