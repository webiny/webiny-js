import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: Number

        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: Number


        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [Number]

        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [Number]

        # Matches if the field value is strictly smaller than the given value
        ${field.fieldId}_lt: Number

        # Matches if the field value is smaller than or equal to the given value
        ${field.fieldId}_lte: Number

        # Matches if the field value is strictly greater than the given value
        ${field.fieldId}_gt: Number

        # Matches if the field value is greater than or equal to the given value
        ${field.fieldId}_gte: Number
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-number",
    type: "cms-model-field-to-graphql",
    fieldType: "number",
    read: {
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            return `${field.fieldId}${localeArg}: Number`;
        }
    },
    manage: {
        createListFilters,
        createResolver({ field }) {
            return instance => {
                return instance[field.fieldId];
            };
        },
        createSchema() {
            return {
                typeDefs: gql`
                    input CmsNumberLocalizedInput {
                        value: Number
                        locale: ID!
                    }

                    input CmsNumberInput {
                        values: [CmsNumberLocalizedInput]
                    }

                    type CmsNumberLocalized {
                        value: Number
                        locale: ID!
                    }

                    type CmsNumber {
                        value: Number
                        values: [CmsNumberLocalized]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsNumber";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsNumberInput";
        }
    }
};

export default plugin;
