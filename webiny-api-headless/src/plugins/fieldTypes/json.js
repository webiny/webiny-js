// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";

export default ({
    name: "cms-headless-field-type-json",
    type: "cms-headless-field-type",
    fieldType: "json",
    isSortable: false,
    read: {
        createResolver() {
            return genericFieldValueResolver;
        },
        createTypeField({ field }) {
            return field.fieldId + ": JSON";
        }
    },
    manage: {
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type HeadlessManageJSON {
                    locale: String
                    value: JSON
                }

                input HeadlessManageJSONInput {
                    locale: String!
                    value: JSON!
                }
            `;
        },
        createTypeField({ field }) {
            return field.fieldId + ": [HeadlessManageJSON]";
        },
        createInputField({ field }) {
            return field.fieldId + ": [HeadlessManageJSONInput]";
        }
    }
}: HeadlessFieldTypePlugin);
