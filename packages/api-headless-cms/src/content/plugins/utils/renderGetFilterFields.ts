import { CmsFieldTypePlugins, CmsContentModel } from "~/types";
import get from "lodash/get";

interface RenderGetFilterFields {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderGetFilterFields: RenderGetFilterFields = ({ model, fieldTypePlugins }) => {
    const fieldIds = model.fields
        .filter(f => {
            // Every time a client updates content model's fields, we check the type of each field. If a field plugin
            // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
            // want to be careful when accessing the field plugin here too. It is still possible to have a content model
            // that contains a field, for which we don't have a plugin registered on the backend. For example, user
            // could've just removed the plugin from the backend.
            return get(fieldTypePlugins, `${f.type}.isSearchable`);
        })
        .map(f => f.fieldId);

    const filters = ["id: ID", "entryId: String"];

    for (let i = 0; i < fieldIds.length; i++) {
        const field = model.fields.find(item => item.fieldId === fieldIds[i]);
        const createGetFilters = get(fieldTypePlugins, `${field.type}.read.createGetFilters`);
        if (typeof createGetFilters === "function") {
            filters.push(createGetFilters({ model, field }));
        }
    }

    return filters.filter(Boolean).join("\n");
};
