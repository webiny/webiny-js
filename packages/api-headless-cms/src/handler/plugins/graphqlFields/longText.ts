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
    name: "cms-model-field-to-graphql-long-text",
    type: "cms-model-field-to-graphql",
    fieldType: "long-text",
    isSortable: false,
    read: {
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            return `${field.fieldId}${localeArg}: String`;
        },
        createGetFilters({ field }) {
            if (!field.unique) {
                return null;
            }
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
                    input CmsLongTextLocalizedInput {
                        value: String
                        locale: ID!
                    }

                    input CmsLongTextInput {
                        values: [CmsLongTextLocalizedInput]
                    }

                    type CmsLongTextLocalized {
                        value: String
                        locale: ID!
                    }

                    type CmsLongText {
                        value(locale: String): String
                        values: [CmsLongTextLocalized]!
                    }
                `,
                resolvers: {
                    CmsLongText: {
                        value(field, args) {
                            return field.value(args.locale);
                        }
                    }
                }
            };
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsLongText";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsLongTextInput";
        }
    }
};

export default plugin;
