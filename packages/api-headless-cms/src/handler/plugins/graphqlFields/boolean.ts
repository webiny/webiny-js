import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

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
                    input CmsBooleanLocalizedInput {
                        value: Boolean
                        locale: ID!
                    }

                    input CmsBooleanInput {
                        values: [CmsBooleanLocalizedInput]
                    }

                    type CmsBooleanLocalized {
                        value: Boolean
                        locale: ID!
                    }

                    type CmsBoolean {
                        value: Boolean
                        values: [CmsBooleanLocalized]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsBoolean";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsBooleanInput";
        }
    }
};

export default plugin;
