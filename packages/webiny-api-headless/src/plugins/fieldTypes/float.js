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
