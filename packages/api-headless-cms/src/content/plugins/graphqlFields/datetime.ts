import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        ${field.fieldId}: String
        ${field.fieldId}_not: String
        ${field.fieldId}_in: [String]
        ${field.fieldId}_not_in: [String]
        ${field.fieldId}_lt: String
        ${field.fieldId}_lte: String
        ${field.fieldId}_gt: String
        ${field.fieldId}_gte: String
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-datetime",
    type: "cms-model-field-to-graphql",
    fieldType: "datetime",
    isSortable: true,
    isSearchable: true,
    read: {
        createListFilters,
        createGetFilters({ field }) {
            return `${field.fieldId}: String`;
        },
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [String]`;
            }

            return `${field.fieldId}: String`;
        }
    },
    manage: {
        createListFilters,
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        },
        createTypeField({ field }) {
            return field.fieldId + ": String";
        },
        createInputField({ field }) {
            return field.fieldId + ": String";
        }
    }
};

export default plugin;
