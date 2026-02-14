import type { CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { createGraphQLInputField } from "./helpers.js";

export const createSearchableJsonField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-searchable-json",
        type: "cms-model-field-to-graphql",
        fieldType: "searchable-json",
        isSortable: true,
        isSearchable: true,
        fullTextSearch: true,
        read: {
            createTypeField({ field }) {
                if (field.list) {
                    return `${field.fieldId}: [JSON]`;
                }

                return `${field.fieldId}: JSON`;
            },
            createGetFilters({ field }) {
                return `${field.fieldId}: JSON`;
            },
            createListFilters({ field }) {
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
            },
            createListFilters({ field }) {
                return `${field.fieldId}: JSON`;
            }
        }
    };
};
