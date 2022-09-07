import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

export const createFileField = (): CmsModelFieldToGraphQLPlugin => {
    return {
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
                return createGraphQLInputField(field, "String");
            }
        }
    };
};
