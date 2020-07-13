import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldType } from "./../graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-text",
    type: "cms-model-field-to-graphql",
    fieldType: "text",
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
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        }
    },
    manage: {
        createResolver({ field }) {
            return instance => {
                return instance[field.fieldId];
            };
        },
        createSchema() {
            return {
                typeDefs: gql`
                    ${i18nFieldType("CmsText", "String")}
                    ${i18nFieldInput("CmsText", "String")}
                `,
                resolvers: {
                    CmsText: {
                        value(field, args) {
                            // TODO: Revisit, check meta title field returning `undefined`
                            if (field.value && typeof field.value === "function") {
                                return field.value(args.locale);
                            }
                            return null;
                        }
                    }
                }
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsTextList";
            }
            return field.fieldId + ": CmsText";
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsTextListInput";
            }
            return field.fieldId + ": CmsTextInput";
        }
    }
};

export default plugin;
