import { CmsFieldTypePlugins, CmsModel, CmsModelFieldToGraphQLPlugin } from "~/types";

interface RenderGetFilterFieldsParams {
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface RenderGetFilterFields {
    (params: RenderGetFilterFieldsParams): string;
}

const getCreateFilters = (
    plugins: CmsFieldTypePlugins,
    fieldType: string
): CmsModelFieldToGraphQLPlugin["read"]["createGetFilters"] | null => {
    if (!plugins[fieldType] || !plugins[fieldType].read.createGetFilters) {
        return null;
    }
    return plugins[fieldType].read.createGetFilters;
};

export const renderGetFilterFields: RenderGetFilterFields = ({ model, fieldTypePlugins }) => {
    const fieldIds = model.fields
        .filter(field => {
            // Every time a client updates content model's fields, we check the type of each field. If a field plugin
            // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
            // want to be careful when accessing the field plugin here too. It is still possible to have a content model
            // that contains a field, for which we don't have a plugin registered on the backend. For example, user
            // could've just removed the plugin from the backend.
            if (!fieldTypePlugins[field.type]) {
                return false;
            }
            return fieldTypePlugins[field.type].isSearchable;
        })
        .map(f => f.fieldId);

    const filters: string[] = ["id: ID", "entryId: String"];

    for (const id of fieldIds) {
        const field = model.fields.find(item => item.fieldId === id);
        if (!field) {
            continue;
        }
        const createGetFilters = getCreateFilters(fieldTypePlugins, field.type);
        if (typeof createGetFilters !== "function") {
            continue;
        }
        filters.push(createGetFilters({ model, field }));
    }

    return filters.filter(Boolean).join("\n");
};
