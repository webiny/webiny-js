// @flow
import type { CmsFieldTypePlugin } from "@webiny/api-cms/types";
import genericFieldValueResolver from "@webiny/api-cms/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-cms/utils/genericFieldValueSetter";

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
    name: "cms-field-type-datetime",
    type: "cms-field-type",
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
