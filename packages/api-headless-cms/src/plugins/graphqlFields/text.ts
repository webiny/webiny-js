import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: String
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: String
        
        # Matches if the field exists
        ${field.fieldId}_exists: Boolean
        
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
    isSortable: true,
    read: {
        createTypeField({ field }) {
            const localeArg = field.localization ? "(locale: String)" : "";
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
        createTypes() {
            return /* GraphQL */ `
                input CmsManageTextLocalizedInput {
                    value: String
                    locale: ID!
                }

                input CmsManageTextInput {
                    values: [CmsManageTextLocalizedInput]
                }

                type CmsManageTextLocalized {
                    value: String
                    locale: ID!
                }

                type CmsManageText {
                    value: String
                    values: [CmsManageTextLocalized]!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsManageText";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsManageTextInput";
        }
    }
};

export default plugin;
