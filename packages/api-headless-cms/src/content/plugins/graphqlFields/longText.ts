import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
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
                return attachRequiredFieldValue(field.fieldId + ": [String]", field);
            }

            return attachRequiredFieldValue(field.fieldId + ": String", field);
        }
    }
};

export default plugin;
