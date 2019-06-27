// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";

export default ({
    name: "cms-headless-field-type-float",
    type: "cms-headless-field-type",
    fieldType: "float",
    i18n: false,
    read: {
        createTypeField({ field }) {
            return field.fieldId + ": Float";
        }
    },
    manage: {
        createTypeField({ field }) {
            return field.fieldId + ": Float";
        },
        createInputField({ field }) {
            return field.fieldId + ": Float";
        }
    }
}: HeadlessFieldTypePlugin);
