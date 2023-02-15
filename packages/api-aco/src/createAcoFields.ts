import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

// Creating an internal JSON field, we are using it inside the `record` type
const jsonField: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-json",
    type: "cms-model-field-to-graphql",
    fieldType: "wby-aco-json",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            return `${field.fieldId}: JSON`;
        },
        createGetFilters({ field }) {
            return `${field.fieldId}: JSON`;
        }
    },
    manage: {
        createTypeField({ field }) {
            return `${field.fieldId}: JSON`;
        },
        createInputField({ field }) {
            return field.fieldId + ": JSON";
        }
    }
};

export const createAcoFields = (): CmsModelFieldToGraphQLPlugin[] => [jsonField];
