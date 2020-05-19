
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: JSON

        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: JSON


        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [JSON]

        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [JSON]

        # Matches if given value is a substring of the the field value
        ${field.fieldId}_contains: JSON

        # Matches if given value is not a substring of the the field value
        ${field.fieldId}_not_contains: JSON
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-rich-text",
    type: "cms-model-field-to-graphql",
    fieldType: "rich-text",
    isSortable: true,
    read: {
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            return `${field.fieldId}${localeArg}: JSON`;
        },
        createGetFilters({ field }) {
            if (!field.unique) {
                return null;
            }
            return `${field.fieldId}: JSON`;
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
        createTypeField({ field }) {
            return field.fieldId + ": CmsJSON";
        },
        createInputField({ field }) {
            return field.fieldId + ": CmsJSONInput";
        }
    }
};

export default plugin;
