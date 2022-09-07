import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.fieldId}: Boolean
        ${field.fieldId}_not: Boolean
    `;
};

export const createBooleanField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-boolean",
        type: "cms-model-field-to-graphql",
        fieldType: "boolean",
        isSortable: true,
        isSearchable: true,
        read: {
            createListFilters,
            createGetFilters({ field }) {
                return `${field.fieldId}: Boolean`;
            },
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [Boolean]`;
                }

                return `${field.fieldId}: Boolean`;
            }
        },
        manage: {
            createListFilters,
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return field.fieldId + ": [Boolean]";
                }

                return field.fieldId + ": Boolean";
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "Boolean");
            }
        }
    };
};
