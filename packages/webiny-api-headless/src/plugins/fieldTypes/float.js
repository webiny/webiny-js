// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";

export default ({
    name: "cms-headless-field-type-float",
    type: "cms-headless-field-type",
    fieldType: "float",
    isSortable: true,
    read: {
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": Float";
        }
    },
    manage: {
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type Manage_HeadlessFloat {
                    locale: String
                    value: Float
                }

                input Manage_HeadlessFloatInput {
                    locale: String!
                    value: Float!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [Manage_HeadlessFloat]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [Manage_HeadlessFloatInput]";
        }
    }
}: HeadlessFieldTypePlugin);
