import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.alias}: Boolean
        ${field.alias}_not: Boolean
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-boolean",
    type: "cms-model-field-to-graphql",
    fieldType: "boolean",
    isSortable: true,
    isSearchable: true,
    read: {
        createListFilters,
        createGetFilters({ field }) {
            return `${field.alias}: Boolean`;
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.alias}: [Boolean]`;
            }

            return `${field.alias}: Boolean`;
        }
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.alias + ": [Boolean]";
            }

            return field.alias + ": Boolean";
        },
        createInputField({ field }) {
            return createGraphQLInputField(field, "Boolean");
        }
    }
};

export default plugin;
