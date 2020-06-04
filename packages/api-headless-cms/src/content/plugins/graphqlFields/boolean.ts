import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldType } from "./../graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: Boolean
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: Boolean

    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-boolean",
    type: "cms-model-field-to-graphql",
    fieldType: "boolean",
    read: {
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            if (field.multipleValues) {
                return `${field.fieldId}${localeArg}: [Boolean]`;
            }

            return `${field.fieldId}${localeArg}: Boolean`;
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
                    ${i18nFieldType("CmsBoolean", "Boolean")}
                    ${i18nFieldInput("CmsBoolean", "Boolean")}
                `
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsBooleanList";
            }

            return field.fieldId + ": CmsBoolean";
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsBooleanListInput";
            }

            return field.fieldId + ": CmsBooleanInput";
        }
    }
};

export default plugin;
