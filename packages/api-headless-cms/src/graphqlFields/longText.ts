import type {
    CmsModelField,
    CmsModelFieldToGraphQLCreateResolver,
    CmsModelFieldToGraphQLPlugin
} from "~/types/index.js";
import { createGraphQLInputField } from "./helpers.js";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.fieldId}_contains: String
        ${field.fieldId}_not_contains: String
    `;
};
const createResolver: CmsModelFieldToGraphQLCreateResolver = ({ field }) => {
    return async parent => {
        return parent[field.fieldId] || null;
    };
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
                if (field.list) {
                    return `${field.fieldId}: [String]`;
                }

                return `${field.fieldId}: String`;
            },
            createListFilters,
            createResolver
        },
        manage: {
            createListFilters,
            createTypeField({ field }) {
                if (field.list) {
                    return field.fieldId + ": [String]";
                }

                return field.fieldId + ": String";
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "String");
            },
            createResolver
        }
    };
};
