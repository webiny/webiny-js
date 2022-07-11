import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.fieldId}: String
        ${field.fieldId}_not: String
        ${field.fieldId}_in: [String]
        ${field.fieldId}_not_in: [String]
        ${field.fieldId}_contains: String
        ${field.fieldId}_not_contains: String
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-text",
    type: "cms-model-field-to-graphql",
    fieldType: "text",
    isSortable: true,
    isSearchable: true,
    fullTextSearch: true,
    read: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [String]`;
            }
            return `${field.fieldId}: String`;
        },
        createGetFilters({ field }) {
            return `${field.fieldId}: String`;
        },
        createListFilters
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [String]`;
            }
            return `${field.fieldId}: String`;
        },
        createInputField({ field }) {
            return createGraphQLInputField(field, "String");
        }
    }
};

export default plugin;
