// @flow
import type { HeadlessFieldTypePlugin } from "@webiny/api-headless/types";
import genericFieldValueResolver from "@webiny/api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-headless/utils/genericFieldValueSetter";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: DateTime
        
        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: DateTime
        
        # Matches if the field exists
        ${field.fieldId}_exists: Boolean
        
        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [DateTime]
        
        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [DateTime]
        
        # Matches if the field value is strictly smaller than the given value
        ${field.fieldId}_lt: DateTime
        
        # Matches if the field value is smaller than or equal to the given value
        ${field.fieldId}_lte: DateTime
        
        # Matches if the field value is strictly greater than the given value
        ${field.fieldId}_gt: DateTime
        
        # Matches if the field value is greater than or equal to the given value
        ${field.fieldId}_gte: DateTime
    `;
};

export default ({
    name: "cms-headless-field-type-datetime",
    type: "cms-headless-field-type",
    fieldType: "datetime",
    isSortable: true,
    read: {
        createListFilters,
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            switch (type) {
                case "time":
                    return "String";
                case "dateTimeWithoutTimezone":
                    return "String";
            }

            return field.fieldId + ": DateTime";
        }
    },
    manage: {
        createListFilters,
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type HeadlessManageInt {
                    locale: String
                    value: Int
                }

                input HeadlessManageIntInput {
                    locale: String!
                    value: Int!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [HeadlessManageInt]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [HeadlessManageIntInput]";
        }
    }
}: HeadlessFieldTypePlugin);
