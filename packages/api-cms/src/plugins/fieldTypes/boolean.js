// @flow
import type { CmsFieldTypePlugin } from "@webiny/api-cms/types";
import genericFieldValueResolver from "@webiny/api-cms/utils/genericFieldValueResolver";
import genericFieldValueSetter from "@webiny/api-cms/utils/genericFieldValueSetter";

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
    name: "cms-field-type-boolean",
    type: "cms-field-type",
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
                type CmsManageBoolean {
                    locale: String
                    value: Boolean
                }

                input CmsManageBooleanInput {
                    locale: String!
                    value: Boolean!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [CmsManageBoolean]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [CmsManageBooleanInput]";
        }
    }
}: CmsFieldTypePlugin);
