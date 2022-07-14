import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.fieldId}: Number
        ${field.fieldId}_not: Number
        ${field.fieldId}_in: [Number]
        ${field.fieldId}_not_in: [Number]
        ${field.fieldId}_lt: Number
        ${field.fieldId}_lte: Number
        ${field.fieldId}_gt: Number
        ${field.fieldId}_gte: Number
    `;
};

export const createNumberField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-number",
        type: "cms-model-field-to-graphql",
        fieldType: "number",
        isSortable: true,
        isSearchable: true,
        read: {
            createGetFilters({ field }) {
                return `${field.fieldId}: Number`;
            },
            createListFilters,
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [Number]`;
                }

                return `${field.fieldId}: Number`;
            }
        },
        manage: {
            createListFilters,
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return field.fieldId + ": [Number]";
                }

                return field.fieldId + ": Number";
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "Number");
            }
        }
    };
};
