// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";

export default ({
    name: "cms-headless-field-type-json",
    type: "cms-headless-field-type",
    fieldType: "json",
    i18n: false,
    read: {
        createTypeField({ field }) {
            return field.fieldId + ": JSON";
        }
    },
    manage: {
        createTypeField({ field }) {
            return field.fieldId + ": JSON";
        },
        createInputField({ field }) {
            return field.fieldId + ": JSON";
        }
    }
}: HeadlessFieldTypePlugin);
