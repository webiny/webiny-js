import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldType } from "./../graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-number",
    type: "cms-model-field-to-graphql",
    fieldType: "number",
    read: {
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            if (field.multipleValues) {
                return `${field.fieldId}${localeArg}: [Number]`;
            }

            return `${field.fieldId}${localeArg}: Number`;
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
                    ${i18nFieldType("CmsNumber", "Number")}
                    ${i18nFieldInput("CmsNumber", "Number")}
                `
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsNumberList";
            }

            return field.fieldId + ": CmsNumber";
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsNumberListInput";
            }

            return field.fieldId + ": CmsNumberInput";
        }
    }
};

export default plugin;
