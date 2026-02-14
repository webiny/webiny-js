import type { CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { createGraphQLInputField } from "./helpers.js";

export const createJsonField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-json",
        type: "cms-model-field-to-graphql",
        fieldType: "json",
        isSortable: false,
        isSearchable: false,
        read: {
            createTypeField({ field }) {
                if (field.list) {
                    return `${field.fieldId}: [JSON]`;
                }

                return `${field.fieldId}: JSON`;
            },
            createGetFilters({ field }) {
                return `${field.fieldId}: JSON`;
            }
        },
        manage: {
            createTypeField({ field }) {
                if (field.list) {
                    return `${field.fieldId}: [JSON]`;
                }
                return `${field.fieldId}: JSON`;
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "JSON");
            }
        }
    };
};
