// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";

export default ({
    name: "cms-headless-field-type-boolean",
    type: "cms-headless-field-type",
    fieldType: "boolean",
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
                type Manage_HeadlessBoolean {
                    locale: String
                    value: Boolean
                }

                input Manage_HeadlessBooleanInput {
                    locale: String!
                    value: Boolean!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [Manage_HeadlessBoolean]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [Manage_HeadlessBooleanInput]";
        }
    }
}: HeadlessFieldTypePlugin);
