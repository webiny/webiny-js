import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-rich-text",
    type: "cms-model-field-to-graphql",
    fieldType: "rich-text",
    read: {
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            return `${field.fieldId}${localeArg}: JSON`;
        },
        createGetFilters({ field }) {
            return `${field.fieldId}: JSON`;
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
        createTypeField({ field }) {
            return field.fieldId + ": CmsJSON";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsJSONInput";
        }
    }
};

export default plugin;
