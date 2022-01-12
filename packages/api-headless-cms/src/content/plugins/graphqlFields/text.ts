import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

const createListFilters = ({ field }) => {
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
            if (field.multipleValues) {
                return attachRequiredFieldValue(field.alias + ": [String]", field);
            }
            return attachRequiredFieldValue(field.alias + ": String", field);
        }
    }
};

export default plugin;
