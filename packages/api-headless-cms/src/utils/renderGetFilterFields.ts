import { CmsFieldTypePlugins, CmsModel, CmsModelFieldToGraphQLPlugin } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

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
    const fieldIdList = model.fields
        .filter(field => {
            // Every time a client updates content model's fields, we check the type of each field. If a field plugin
            // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
            // want to be careful when accessing the field plugin here too. It is still possible to have a content model
            // that contains a field, for which we don't have a plugin registered on the backend. For example, user
            // could've just removed the plugin from the backend.
            const baseType = getBaseFieldType(field);
            if (!fieldTypePlugins[baseType]) {
                return false;
            }
            return fieldTypePlugins[baseType].isSearchable;
        })
        .map(f => f.fieldId);

    const filters: string[] = ["id: ID", "entryId: String"];

    for (const fieldId of fieldIdList) {
        const field = model.fields.find(item => item.fieldId === fieldId);
        if (!field) {
            continue;
        }
        const baseType = getBaseFieldType(field);
        const createGetFilters = getCreateFilters(fieldTypePlugins, baseType);
        if (typeof createGetFilters !== "function") {
            continue;
        }
        filters.push(createGetFilters({ model, field }));
    }

    return filters.filter(Boolean).join("\n");
};
