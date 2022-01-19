import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

const createListFilters = ({ field }) => {
    return `
        ${field.fieldId}: Boolean
        ${field.fieldId}_not: Boolean
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
            return `${field.fieldId}: Boolean`;
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [Boolean]`;
            }

            return `${field.fieldId}: Boolean`;
        }
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": [Boolean]";
            }

            return field.fieldId + ": Boolean";
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return attachRequiredFieldValue(field.fieldId + ": [Boolean]", field);
            }

            return attachRequiredFieldValue(field.fieldId + ": Boolean", field);
        }
    }
};

export default plugin;
