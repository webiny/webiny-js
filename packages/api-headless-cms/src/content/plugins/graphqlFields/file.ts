import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

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
            return createGraphQLInputField(field, "String");
        }
    }
};

export default plugin;
