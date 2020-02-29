import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: Int
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: Int

        
        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [Int]
        
        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [Int]
        
        # Matches if the field value is strictly smaller than the given value
        ${field.fieldId}_lt: Int
        
        # Matches if the field value is smaller than or equal to the given value
        ${field.fieldId}_lte: Int
        
        # Matches if the field value is strictly greater than the given value
        ${field.fieldId}_gt: Int
        
        # Matches if the field value is greater than or equal to the given value
        ${field.fieldId}_gte: Int
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-integer",
    type: "cms-model-field-to-graphql",
    fieldType: "integer",
    isSortable: true,
    read: {
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const localeArg = field.localization ? "(locale: String)" : "";
            return `${field.fieldId}${localeArg}: Int`;
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
                    input CmsManageIntLocalizedInput {
                        value: Int
                        locale: ID!
                    }

                    input CmsManageIntInput {
                        values: [CmsManageIntLocalizedInput]
                    }

                    type CmsManageIntLocalized {
                        value: Int
                        locale: ID!
                    }

                    type CmsManageInt {
                        value: Int
                        values: [CmsManageIntLocalized]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsManageInt";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsManageIntInput";
        }
    }
};

export default plugin;
