import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-file",
    type: "cms-model-field-to-graphql",
    fieldType: "file",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.alias}: [String]`;
            }

            return `${field.alias}: String`;
        }
    },
    manage: {
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
