// @flow
import type { CmsFieldTypePlugin } from "@webiny/api-cms/types";
import genericFieldValueResolver from "@webiny/api-cms/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-cms/utils/genericFieldValueSetter";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: Int
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: Int
        
        # Matches if the field exists
        ${field.fieldId}_exists: Boolean
        
        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [Int]
        
        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [Int]
        
        # Matches if the field value is strictly smaller than the given value
        ${field.fieldId}_lt: Int
        
        # Matches if the field value is smaller than or equal to the given value
        ${field.fieldId}_lte: Int
        
        # Matches if the field value is strictly greater than the given value
        ${field.fieldId}_gt: Int
        
        # Matches if the field value is greater than or equal to the given value
        ${field.fieldId}_gte: Int
    `;
};

export default ({
    name: "cms-field-type-integer",
    type: "cms-field-type",
    fieldType: "integer",
    isSortable: true,
    read: {
        createListFilters,
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": Int";
        }
    },
    manage: {
        createListFilters,
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type CmsManageInt {
                    locale: String
                    value: Int
                }

                input CmsManageIntInput {
                    locale: String!
                    value: Int!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [CmsManageInt]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [CmsManageIntInput]";
        }
    }
}: CmsFieldTypePlugin);
