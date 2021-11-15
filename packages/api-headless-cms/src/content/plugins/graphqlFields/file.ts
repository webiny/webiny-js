import { CmsModelFieldToGraphQLPlugin } from "~/types";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-file",
    type: "cms-model-field-to-graphql",
    fieldType: "file",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [String]`;
            }

            return `${field.fieldId}: String`;
        }
    },
    manage: {
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
