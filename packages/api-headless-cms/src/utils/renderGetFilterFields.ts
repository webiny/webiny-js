import type { CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface RenderGetFilterFieldsParams {
    fields: CmsModelField[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}
interface RenderGetFilterFieldsResponse {
    baseFilters: string[];
    baseFiltersAsString(): string;
    fieldFilters: string[];
    fieldFiltersAsString(): string;
    allFiltersAsString(): string;
}

interface RenderGetFilterFields {
    (params: RenderGetFilterFieldsParams): RenderGetFilterFieldsResponse;
}

export const renderGetFilterFields: RenderGetFilterFields = ({
    fields,
    fieldRegistry
}): RenderGetFilterFieldsResponse => {
    const baseFilters: string[] = ["id: ID", "entryId: String"];

    const fieldFilters: string[] = [];

    for (const field of fields) {
        // Every time a client updates content model's fields, we check the type of each field. If a field plugin
        // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
        // want to be careful when accessing the field plugin here too. It is still possible to have a content model
        // that contains a field, for which we don't have a plugin registered on the backend. For example, user
        // could've just removed the plugin from the backend.
        const baseType = getBaseFieldType(field);
        const plugin = fieldRegistry.get(baseType);
        if (!plugin?.isSearchable) {
            continue;
        }
        const createGetFilters = plugin.read?.createGetFilters;
        if (typeof createGetFilters !== "function") {
            continue;
        }
        fieldFilters.push(createGetFilters({ field }));
    }
    return {
        baseFilters,
        fieldFilters,
        baseFiltersAsString() {
            return baseFilters.join("\n");
        },
        fieldFiltersAsString() {
            return fieldFilters.join("\n");
        },
        allFiltersAsString() {
            return [...baseFilters, ...fieldFilters].join("\n");
        }
    };
};
