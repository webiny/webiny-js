// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";

export default ({
    name: "cms-headless-field-type-boolean",
    type: "cms-headless-field-type",
    fieldType: "boolean",
    isSortable: true,
    read: {
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": Boolean";
        }
    },
    manage: {
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
