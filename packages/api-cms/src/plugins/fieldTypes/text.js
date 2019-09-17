// @flow
import type { CmsFieldTypePlugin } from "@webiny/api-cms/types";
import genericFieldValueResolver from "@webiny/api-cms/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-cms/utils/genericFieldValueSetter";

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

export default ({
    name: "cms-field-type-text",
    type: "cms-field-type",
    fieldType: "text",
    isSortable: true,
    read: {
        createListFilters,
        createTypeField({ field }) {
            return `${field.fieldId}(locale: String): String`;
        },
        createResolver() {
            return genericFieldValueResolver;
        }
    },
    manage: {
        createListFilters,
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type CmsManageText {
                    locale: String
                    value: String
                }

                input CmsManageTextInput {
                    locale: String!
                    value: String!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [CmsManageText]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [CmsManageTextInput]";
        }
    }
}: CmsFieldTypePlugin);
