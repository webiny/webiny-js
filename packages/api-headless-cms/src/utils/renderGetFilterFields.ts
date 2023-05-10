import { CmsFieldTypePlugins, CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface RenderGetFilterFieldsParams {
    fields: CmsModelField[];
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface RenderGetFilterFields {
    (params: RenderGetFilterFieldsParams): string;
}

export const renderGetFilterFields: RenderGetFilterFields = ({ fields, fieldTypePlugins }) => {
    const filters: string[] = ["id: ID", "entryId: String"];

    for (const field of fields) {
        // Every time a client updates content model's fields, we check the type of each field. If a field plugin
        // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
        // want to be careful when accessing the field plugin here too. It is still possible to have a content model
        // that contains a field, for which we don't have a plugin registered on the backend. For example, user
        // could've just removed the plugin from the backend.
        const baseType = getBaseFieldType(field);
        const plugin = fieldTypePlugins[baseType];
        if (!plugin?.isSearchable) {
            continue;
        }
        const createGetFilters = plugin.read?.createGetFilters;
        if (typeof createGetFilters !== "function") {
            continue;
        }
        filters.push(createGetFilters({ field }));
    }

    return filters.filter(Boolean).join("\n");
};
