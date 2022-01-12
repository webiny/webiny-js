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
                return `${field.alias}: [JSON]`;
            }

            return `${field.alias}: JSON`;
        },
        createGetFilters({ field }) {
            return `${field.alias}: JSON`;
        }
    },
    manage: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.alias}: [JSON]`;
            }

            return `${field.alias}: JSON`;
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return attachRequiredFieldValue(field.alias + ": [JSON]", field);
            }
            return attachRequiredFieldValue(field.alias + ": JSON", field);
        }
    }
};

export default plugin;
