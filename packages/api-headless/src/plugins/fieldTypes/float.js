// @flow
import type { HeadlessFieldTypePlugin } from "@webiny/api-headless/types";
import genericFieldValueResolver from "@webiny/api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-headless/utils/genericFieldValueSetter";

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
    name: "cms-headless-field-type-float",
    type: "cms-headless-field-type",
    fieldType: "float",
    isSortable: true,
    read: {
        createListFilters,
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": Float";
        }
    },
    manage: {
        createListFilters,
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type HeadlessManageFloat {
                    locale: String
                    value: Float
                }

                input HeadlessManageFloatInput {
                    locale: String!
                    value: Float!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [HeadlessManageFloat]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [HeadlessManageFloatInput]";
        }
    }
}: HeadlessFieldTypePlugin);
