import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: Boolean
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: Boolean
        
        # Matches if the field exists
        ${field.fieldId}_exists: Boolean
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-boolean",
    type: "cms-model-field-to-graphql",
    fieldType: "boolean",
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
        createTypes() {
            return /* GraphQL */ `
                input CmsManageBooleanLocalizedInput {
                    value: Boolean
                    locale: ID!
                }

                input CmsManageBooleanInput {
                    values: [CmsManageBooleanLocalizedInput]
                }

                type CmsManageBooleanLocalized {
                    value: Boolean
                    locale: ID!
                }

                type CmsManageBoolean {
                    value: Boolean
                    values: [CmsManageBooleanLocalized]!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": CmsManageBoolean";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsManageBooleanInput";
        }
    }
};

export default plugin;
