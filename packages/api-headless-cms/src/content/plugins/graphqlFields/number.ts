import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.alias}: Number
        ${field.alias}_not: Number
        ${field.alias}_in: [Number]
        ${field.alias}_not_in: [Number]
        ${field.alias}_lt: Number
        ${field.alias}_lte: Number
        ${field.alias}_gt: Number
        ${field.alias}_gte: Number
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-number",
    type: "cms-model-field-to-graphql",
    fieldType: "number",
    isSortable: true,
    isSearchable: true,
    read: {
        createGetFilters({ field }) {
            return `${field.alias}: Number`;
        },
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.alias}: [Number]`;
            }

            return `${field.alias}: Number`;
        }
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.alias + ": [Number]";
            }

            return field.alias + ": Number";
        },
        createInputField({ field }) {
            return createGraphQLInputField(field, "Number");
        }
    }
};

export default plugin;
