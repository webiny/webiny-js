import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldType } from "./../graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";

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
    read: {
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            if (field.multipleValues) {
                return `${field.fieldId}${localeArg}: [String]`;
            }

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
                    ${i18nFieldType("CmsLongText", "String")}
                    ${i18nFieldInput("CmsLongText", "String")}
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
            if (field.multipleValues) {
                return field.fieldId + ": CmsLongTextList";
            }

            return field.fieldId + ": CmsLongText";
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsLongTextListInput";
            }

            return field.fieldId + ": CmsLongTextInput";
        }
    }
};

export default plugin;
