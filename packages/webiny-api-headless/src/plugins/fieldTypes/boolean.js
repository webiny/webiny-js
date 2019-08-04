// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";

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

export default ({
    name: "cms-headless-field-type-boolean",
    type: "cms-headless-field-type",
    fieldType: "boolean",
    isSortable: true,
    read: {
        createListFilters,
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": Boolean";
        }
    },
    manage: {
        createListFilters,
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type HeadlessManageBoolean {
                    locale: String
                    value: Boolean
                }

                input HeadlessManageBooleanInput {
                    locale: String!
                    value: Boolean!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [HeadlessManageBoolean]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [HeadlessManageBooleanInput]";
        }
    }
}: HeadlessFieldTypePlugin);
