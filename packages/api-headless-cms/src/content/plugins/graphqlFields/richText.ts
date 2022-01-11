import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-rich-text",
    type: "cms-model-field-to-graphql",
    fieldType: "rich-text",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [JSON]`;
            }

            return `${field.fieldId}: JSON`;
        },
        createGetFilters({ field }) {
            return `${field.fieldId}: JSON`;
        }
    },
    manage: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [JSON]`;
            }

            return `${field.fieldId}: JSON`;
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return attachRequiredFieldValue(field.fieldId + ": [JSON]", field);
            }
            return attachRequiredFieldValue(field.fieldId + ": JSON", field);
        }
    }
};

export default plugin;
