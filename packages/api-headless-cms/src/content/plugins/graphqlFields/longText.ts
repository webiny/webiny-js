import { CmsModelFieldToGraphQLPlugin } from "~/types";

const createListFilters = ({ field }) => {
    return `
        ${field.fieldId}_contains: String
        ${field.fieldId}_not_contains: String
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-long-text",
    type: "cms-model-field-to-graphql",
    fieldType: "long-text",
    isSortable: false,
    isSearchable: true,
    read: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [String]`;
            }

            return `${field.fieldId}: String`;
        },
        createListFilters
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": [String]";
            }

            return field.fieldId + ": String";
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": [String]";
            }

            return field.fieldId + ": String";
        }
    }
};

export default plugin;
