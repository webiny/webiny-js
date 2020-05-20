import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: String
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: String

        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [String]
        
        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [String]
        
        # Matches if given value is a substring of the the field value
        ${field.fieldId}_contains: String
        
        # Matches if given value is not a substring of the the field value
        ${field.fieldId}_not_contains: String
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-text",
    type: "cms-model-field-to-graphql",
    fieldType: "text",
    read: {
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            return `${field.fieldId}${localeArg}: String`;
        },
        createGetFilters({ field }) {
            return `${field.fieldId}: String`;
        },
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
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
                    input CmsTextLocalizedInput {
                        value: String
                        locale: ID!
                    }

                    input CmsTextInput {
                        values: [CmsTextLocalizedInput]
                    }

                    type CmsTextLocalized {
                        value: String
                        locale: ID!
                    }

                    type CmsText {
                        value(locale: String): String
                        values: [CmsTextLocalized]!
                    }
                `,
                resolvers: {
                    CmsText: {
                        value(field, args) {
                            return field.value(args.locale);
                        }
                    }
                }
            };
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsText";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsTextInput";
        }
    }
};

export default plugin;
