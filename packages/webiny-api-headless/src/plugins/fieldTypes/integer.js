// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";

export default ({
    name: "cms-headless-field-type-integer",
    type: "cms-headless-field-type",
    fieldType: "integer",
    isSortable: true,
    read: {
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": Int";
        }
    },
    manage: {
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type Manage_HeadlessInt {
                    locale: String
                    value: Int
                }

                input Manage_HeadlessIntInput {
                    locale: String!
                    value: Int!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [Manage_HeadlessInt]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [Manage_HeadlessIntInput]";
        }
    }
}: HeadlessFieldTypePlugin);
