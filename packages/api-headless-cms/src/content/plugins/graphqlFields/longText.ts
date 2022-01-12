import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

const createListFilters = ({ field }) => {
    return `
        ${field.alias}_contains: String
        ${field.alias}_not_contains: String
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
                return `${field.alias}: [String]`;
            }

            return `${field.alias}: String`;
        },
        createListFilters
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.alias + ": [String]";
            }

            return field.alias + ": String";
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
