// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";

export default ({
    name: "cms-headless-field-type-integer",
    type: "cms-headless-field-type",
    fieldType: "integer",
    i18n: false,
    read: {
        createTypeField({ field }) {
            return field.fieldId + ": Int";
        }
    },
    manage: {
        createTypeField({ field }) {
            return field.fieldId + ": Int";
        },
        createInputField({ field }) {
            return field.fieldId + ": Int";
        }
    }
}: HeadlessFieldTypePlugin);
