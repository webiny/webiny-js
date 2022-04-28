import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.alias}: String
        ${field.alias}_not: String
        ${field.alias}_in: [String]
        ${field.alias}_not_in: [String]
        ${field.alias}_contains: String
        ${field.alias}_not_contains: String
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
                return `${field.alias}: [String]`;
            }
            return `${field.alias}: String`;
        },
        createGetFilters({ field }) {
            return `${field.alias}: String`;
        },
        createListFilters
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.alias}: [String]`;
            }
            return `${field.alias}: String`;
        },
        createInputField({ field }) {
            return createGraphQLInputField(field, "String");
        }
    }
};

export default plugin;
