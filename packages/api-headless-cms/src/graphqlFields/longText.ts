import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.fieldId}_contains: String
        ${field.fieldId}_not_contains: String
    `;
};

export const createLongTextField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-long-text",
        type: "cms-model-field-to-graphql",
        fieldType: "long-text",
        isSortable: false,
        isSearchable: true,
        fullTextSearch: true,
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
                return createGraphQLInputField(field, "String");
            }
        }
    };
};
