import { CmsFieldTypePlugins, CmsModel } from "~/types";

interface RenderGetFilterFields {
    (params: { model: CmsModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderGetFilterFields: RenderGetFilterFields = ({ model, fieldTypePlugins }) => {
    // Every time a client updates content model's fields, we check the type of each field. If a field plugin
    // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
    // want to be careful when accessing the field plugin here too. It is still possible to have a content model
    // that contains a field, for which we don't have a plugin registered on the backend. For example, user
    // could've just removed the plugin from the backend.
    const fields = model.fields.filter(field => {
        if (!field.alias) {
            return false;
        }
        const plugin = fieldTypePlugins[field.type];
        return plugin && plugin.isSearchable;
    });
    const filters: string[] = ["id: ID", "entryId: String"];

    for (const field of fields) {
        const plugin = fieldTypePlugins[field.type];
        if (!plugin || !plugin.read || typeof plugin.read.createGetFilters !== "function") {
            continue;
        }
        filters.push(plugin.read.createGetFilters({ model, field }));
    }

    return filters.filter(Boolean).join("\n");
};
