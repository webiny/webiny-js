import type { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { createGraphQLInputField } from "./helpers.js";

interface CreateListFiltersParams {
    field: Pick<CmsModelField, "fieldId" | "settings">;
}
const createListFilters = ({ field }: CreateListFiltersParams): string => {
    return `
        ${field.fieldId}: String
        ${field.fieldId}_not: String
        ${field.fieldId}_in: [String]
        ${field.fieldId}_not_in: [String]
        ${field.fieldId}_contains: String
        ${field.fieldId}_not_contains: String
        ${field.fieldId}_startsWith: String
        ${field.fieldId}_not_startsWith: String
    `;
};

export const createTextField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-text",
        type: "cms-model-field-to-graphql",
        fieldType: "text",
        isSortable: true,
        isSearchable: true,
        fullTextSearch: true,
        read: {
            createTypeField({ field }) {
                if (field.list) {
                    return `${field.fieldId}: [String]`;
                }
                return `${field.fieldId}: String`;
            },
            createGetFilters({ field }) {
                return `${field.fieldId}: String`;
            },
            createListFilters
        },
        manage: {
            createListFilters,
            createTypeField({ field }) {
                if (field.list) {
                    return `${field.fieldId}: [String]`;
                }
                return `${field.fieldId}: String`;
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "String");
            }
        }
    };
};
