import type { CmsModelFieldToGraphQLPlugin } from "~/types/index.js";

export const createUiField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-ui",
        type: "cms-model-field-to-graphql",
        fieldType: "ui",
        isSortable: false,
        isSearchable: false,
        fullTextSearch: false,
        read: {
            createTypeField({ field }) {
                return `${field.fieldId}: String`;
            }
        },
        manage: {
            createTypeField({ field }) {
                return `${field.fieldId}: String`;
            },
            createInputField() {
                return "";
            }
        }
    };
};
