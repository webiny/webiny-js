import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-file",
    type: "cms-model-field-to-graphql",
    fieldType: "file",
    isSortable: false,
    isSearchable: false,
    read: {
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [String]`;
            }

            return `${field.fieldId}: String`;
        }
    },
    manage: {
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        },
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
